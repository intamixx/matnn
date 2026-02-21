FROM ubuntu:latest

# Python 3
ARG python=3
ENV PYTHON_VERSION=${python}

# Set default shell to /bin/bash
SHELL ["/bin/bash", "-cu"]

RUN apt-get update && apt-get install -y --allow-downgrades --allow-change-held-packages --no-install-recommends \
        build-essential \
        cmake \
        g++ \
        git \
        curl \
        vim \
        wget \
        ca-certificates \
        python${PYTHON_VERSION} \
        python${PYTHON_VERSION}-pip \
        python${PYTHON_VERSION}-dev \
        npm \
        jq \
        supervisor

RUN apt install -y ca-certificates curl gnupg

RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
#RUN export NODE_MAJOR=20
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install -y nodejs

#RUN if [[ "${PYTHON_VERSION}" == "3" ]]; then \
#        apt-get install -y python${PYTHON_VERSION}-distutils; \
#    fi

#RUN curl -O https://bootstrap.pypa.io/get-pip.py && \
#    python3 get-pip.py && \
#    rm get-pip.py

# Install FastApi, Express, NPM modules
RUN pip install fastapi --break-system-packages
RUN pip install uvicorn --break-system-packages
RUN pip install prometheus-client --break-system-packages
RUN pip install aiofiles tinydb kubernetes python-multipart --break-system-packages

# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

# Add user to container
RUN userdel ubuntu
RUN useradd -ms /bin/bash web
#USER web
#WORKDIR /home/web

# Install files for FastAPI (backend)
RUN mkdir /fastapi
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/fastapi/main.py -O /fastapi/main.py

# Install files for ViteJS (app frontend)
RUN cd /
RUN git clone --depth 1 https://github.com/intamixx/matnn.git /tmp/matnn
RUN mv /tmp/matnn/vite-app /
RUN mv /vite-app /vitejs

# Install files for ExpressJS (middleware)
RUN mv /tmp/matnn/expressjs /
RUN mv /expressjs /nodejs
RUN mkdir /nodejs/uploads

# Install NPM stack
RUN cd /nodejs && npm i express ejs multer form-data node-fetch@2
# Install NPM stack ViteJS
RUN cd /vitejs && npm install

# Copy ssl certs
#COPY ssl/* /nodejs/ssl

# Ensure UID web : 1000.  runas container user in fastapi should be same.
RUN chown web:web -R /fastapi
RUN chown web:web -R /nodejs
RUN chown web:web -R /vitejs
RUN chown web:web -R /mnt
COPY supervisor-app.conf /etc/supervisor/conf.d

# Supervisor
RUN mkdir -p /var/log/supervisor
CMD ["/usr/bin/supervisord"]
