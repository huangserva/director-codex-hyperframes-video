# DUIX / HeyGem Gen-Video Workflow

This reference captures the verified local offline lip-sync flow and the official source pointers checked on 2026-06-08.

## What This Is

- Offline face2face lip-sync service from the HeyGem/DUIX stack.
- The relevant service is the `gen-video` container, commonly named `duix-avatar-gen-video`.
- The practical internal service port is `8383`.
- The job API is `/easy/submit` plus `/easy/query`.

This is not the same usage path as the DUIX H5/Web SDK for real-time interaction.

## Verified Local Topology

Known deployment shape:

- Web entry: host web port can expose the DUIX UI.
- Containers: `duix-web`, `duix-api`, `duix-avatar-tts`, `duix-avatar-asr`, `duix-avatar-gen-video`.
- Core offline lip-sync service: `duix-avatar-gen-video:8383`.

Do not write SSH passwords in docs or scripts. If SSH is required, retrieve credentials from the user's approved secret location or ask 黄总.

## Job Directory

Place inputs in a directory readable by the `gen-video` container:

```text
/code/data/jobs/<job_id>/source.mp4
/code/data/jobs/<job_id>/dub.wav
```

After copying/uploading, verify from the container side:

```bash
docker exec <gen-video-container> ls -la /code/data/jobs/<job_id>/
```

If using `docker exec` with heredoc Python, include `-i`; otherwise stdin may not enter the container:

```bash
docker exec -i <gen-video-container> python -
```

## Audio Prep

Convert the driving audio to 44.1kHz mono WAV:

```bash
ffmpeg -y -i input.wav -ac 1 -ar 44100 /code/data/jobs/<job_id>/dub.wav
```

Reason: verified runs found that 24k cloned voice audio could fail or mux incorrectly unless converted.

## Submit

Endpoint:

```text
POST http://duix-avatar-gen-video:8383/easy/submit
```

Payload:

```json
{
  "code": "<job_id>",
  "video_url": "/code/data/jobs/<job_id>/source.mp4",
  "audio_url": "/code/data/jobs/<job_id>/dub.wav",
  "watermark_switch": 0,
  "digital_auth": 0,
  "chaofen": 0,
  "pn": 1
}
```

Fields:

- `code`: unique custom job id.
- `video_url`: source video path visible to the container.
- `audio_url`: driving audio path visible to the container.
- `watermark_switch`: `0` disables watermark.
- `digital_auth`: `0` disables digital-human authorization check in the verified local deployment.
- `chaofen`: `0` disables super-resolution for speed and stability.
- `pn`: usually `1`.

## Query

Endpoint:

```text
GET http://duix-avatar-gen-video:8383/easy/query?code=<job_id>
```

Completion condition:

```text
data.status == 2 AND progress == 100
```

Important: `success: true` alone is not completion.

Expected result filename:

```text
<job_id>-r.mp4
```

## Known Pitfalls

- `success:true` is not enough; inspect `data.status` and `progress`.
- `gen-video` can be `threaded=False`; while rendering, query can block. Poll slowly.
- Verify uploaded/copied files with `ls -la`; transfers can silently fail.
- Use container-readable paths, not only host paths.
- Convert audio to 44.1kHz mono.
- Keep `watermark_switch`, `digital_auth`, and `chaofen` at `0` for the verified baseline unless 黄总 asks otherwise.

## Official Sources Checked

- HeyGem offline digital-human project: `https://github.com/duixcom/Duix-Avatar`
- Legacy/redirecting HeyGem repository: `https://github.com/GuijiAI/HeyGem.ai`
- DUIX mobile/real-time interaction repository: `https://github.com/duixcom/Duix-Mobile`
- Legacy/redirecting DUIX repository: `https://github.com/GuijiAI/duix.ai`
- DUIX H5/Web SDK docs: `https://duix.guiji.ai/document/h5/`

Use official repos/docs for installation and deployment details, but prefer the verified local payload above for the known working lip-sync path.
