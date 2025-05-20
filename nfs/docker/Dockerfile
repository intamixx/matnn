FROM debian:bookworm-slim

# Set default shell to /bin/bash
SHELL ["/bin/bash", "-cu"]

# NFS daemon configuration
ENV EXPORT_PATH "/exports"

RUN apt-get update && apt-get install -y --allow-downgrades --allow-change-held-packages --no-install-recommends \
        nfs-ganesha \
        nfs-ganesha-vfs \
        curl \
        vim \
        wget \
        ca-certificates \
        apt-transport-https \
        ca-certificates \
        netbase \
        wget \
        curl \
        gnupg \
        procps \
        net-tools \
        rsync \
        e2fsprogs \
        acl \
        libacl1 \
        nfs-common \
        psmisc \
        dbus \
        libjemalloc2 \
        fuse \
        libcrcutil0 \
        libfuse2 \
        libisal2 \
        xfsprogs \
  # mkdir default export directory
  && \
  mkdir -p ${EXPORT_PATH} && \
  # fix missing directories
  mkdir -p /var/run/ganesha && \
  # fix missing /etc/mtab
  rm -f /etc/mtab && \
  ln -s /proc/mounts /etc/mtab && \
  # cleanup system
  rm -rf /var/lib/apt/lists/* /tmp/* && \
  mkdir -p /run/dbus

# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

ADD Dockerfile entrypoint.sh /
RUN chmod +x /entrypoint.sh

# Add web user with uid 1000

RUN useradd -ms /bin/bash web

# Change permissions to web

# APP ports
EXPOSE 111 111/udp 2049 20048 38465-38467

# entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["-F", "-L", "/dev/stdout", "-f", "/etc/ganesha/ganesha.conf"]
