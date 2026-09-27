# Timeline multicâmera

## Conceito

Cada Session define o relógio comum das gravações. `sessions.started_at` é registrado pelo PostgreSQL quando a Session passa a ativa. Cada vídeo de captura recebe `recording_started_at` ao iniciar o registro no backend; `timeline_offset_ms` guarda a diferença, em milissegundos, entre esse instante e o início da Session.

O registro do vídeo é criado por `start_capture_video` antes do navegador iniciar o `MediaRecorder`. O banco valida pareamento, dispositivo, quadra e estado da Session, usa o relógio do servidor e calcula o offset. Quando a gravação termina, `finish_capture_video` salva a duração medida pelo gravador e calcula `recording_ended_at` como início mais duração. Assim, a latência de upload não alonga a gravação representada na timeline.

## Posição e ordenação

`getVideoTimelinePosition(video, session)` devolve `offsetMs`, `durationMs`, `startMs` e `endMs`. Para vídeos novos, usa o offset persistido e os timestamps de captura. Durações antigas ou ausentes são tratadas como zero para a visualização; vídeos sem timestamps continuam válidos e usam o offset disponível (ou zero). A ordenação e o agrupamento por dispositivo ficam em `video-timeline.service.ts`.

## Visualizações

O detalhe `/arena/sessions/:id` desenha uma faixa por gravação, com nome da câmera, início, duração, fim e estado de processamento. O Player mostra a posição inicial e a duração junto a cada câmera. Isso é apenas metadado e visualização; não altera nem sincroniza a reprodução.

O modo mock usa o mesmo contrato e demonstra uma Session de cerca de 60 segundos com offsets 0 ms, 350 ms e 1200 ms, e durações de 60 s, 59 s e 58 s. O Supabase recebe os mesmos metadados através das RPCs protegidas do Capture Mode.

## Compatibilidade e limites

A migration adiciona colunas sem remover nem tornar obrigatórios dados existentes. `timeline_offset_ms` tem default zero; timestamps podem continuar nulos em registros antigos. O relacionamento existente `capture_devices.session_id` continua representando dispositivos associados à Session; os metadados de início/fim pertencem ao vídeo, pois um dispositivo pode gravar mais de um vídeo por Session.

Esta camada não é frame-perfect: o início é marcado no servidor imediatamente antes da chamada local ao `MediaRecorder`, e o navegador reporta a duração em segundos inteiros. Diferenças de rede, inicialização do encoder e precisão do relógio monotônico local ainda podem causar pequenas variações. Uma referência consistente por Session é suficiente para preparar agrupamento e recortes futuros.

No futuro, um sistema de highlights poderá converter o intervalo escolhido na Session para o intervalo correspondente de cada câmera usando `startMs` e `endMs`. Nenhum detector, tracking, edição ou geração de highlights faz parte desta etapa.
