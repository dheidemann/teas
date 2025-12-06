<div align="center">
  <a href="https://github.com/dheidemann/teas">
    <img src="https://github.com/user-attachments/assets/82874d20-e599-47a1-b6d5-ba1c775a7b1a" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Teas</h3>

  <p align="center">
    The tea to your CUPS installation.<br />Something the whole internet apparently misses on... Here is a dead simple printing frontend for CUPS.
    <br />
    <br />
    <a href="https://github.com/dheidemann/teas/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/dheidemann/teas/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>

  <img width="621" height="561" alt="image" src="https://github.com/user-attachments/assets/cbba591d-e048-4c8c-8bd1-cbb2e2685249" />
</div>

## Deployment via docker-compose
```bash
services:
  teas:
    image: ghcr.io/dheidemann/teas:latest
    ports:
      - 8080:3000
    environment:
      CUPS_SERVER: <your cups server>
```
