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
        python${PYTHON_VERSION}-dev \
        npm \
	supervisor \
        nodejs

RUN if [[ "${PYTHON_VERSION}" == "3" ]]; then \
        apt-get install -y python${PYTHON_VERSION}-distutils; \
    fi

RUN curl -O https://bootstrap.pypa.io/get-pip.py && \
    python3 get-pip.py && \
    rm get-pip.py

# Install FastApi, Express, NPM modules
RUN pip install fastapi
RUN pip install uvicorn
RUN pip install aiofiles tinydb kubernetes python-multipart

# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

# Add user to container
RUN useradd -ms /bin/bash web
#USER web
#WORKDIR /home/web

# Get application code
RUN mkdir /fastapi
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/fastapi/main.py -O /fastapi/main.py
RUN mkdir /nodejs
RUN mkdir /nodejs/uploads
RUN mkdir /nodejs/ssl
RUN mkdir /nodejs/views
RUN mkdir /nodejs/stylesheets
RUN touch /nodejs/views/users.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/upload.js -O /nodejs/upload.js
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/index.js -O /nodejs/index.js
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/footer.html -O /nodejs/views/footer.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/header.html -O /nodejs/views/header.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/result-api.html -O /nodejs/views/result-api.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/result-wrapper.html -O /nodejs/views/result-wrapper.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/status-api.html -O /nodejs/views/status-api.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/status-wrapper.html -O /nodejs/views/status-wrapper.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/views/status.html -O /nodejs/views/status.html
RUN wget https://raw.githubusercontent.com/intamixx/matnn/main/expressjs/stylesheets/style.css -O /nodejs/stylesheets/style.css
# Install NPM stack
RUN cd /nodejs && npm i express ejs multer form-data node-fetch@2

# Copy ssl certs
COPY ssl/* /nodejs/ssl

# Get example python scripts
RUN chown web:web -Rv /fastapi
RUN chown web:web -Rv /nodejs
RUN chown web:web -Rv /mnt
COPY supervisor-app.conf /etc/supervisor/conf.d

# Supervisor
RUN mkdir -p /var/log/supervisor
CMD ["/usr/bin/supervisord"]
