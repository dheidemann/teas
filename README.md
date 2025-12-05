<div align="center">
  <a href="https://github.com/dheidemann/teas">
    <img src="https://github.com/user-attachments/assets/82874d20-e599-47a1-b6d5-ba1c775a7b1a" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Teas</h3>

  <p align="center">
    The tea to your CUPS installation
    <br />
    <br />
    <a href="https://github.com/dheidemann/teas/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/dheidemann/teas/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
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

## Contributions
1. [create an issue](https://github.com/dheidemann/teas/issues/new)
2. from this issue create a branch and work on it
