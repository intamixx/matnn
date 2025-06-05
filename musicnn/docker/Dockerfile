FROM debian:11.7

ENV TENSORFLOW_VERSION=2.14.0
ENV KERAS_VERSION=2.14.0
ENV PYTORCH_VERSION=1.12.1
ENV TORCHVISION_VERSION=0.13.1
ENV HOROVOD_VERSION=0.28.1
ENV NUMPY_VERSION=1.25.2
ENV MATPLOTLIB_VERSION=3.8.0
ENV LIBROSA_VERSION=0.10.1
ENV H5PY_VERSION=3.9.0
ENV ESSENTIA_VERSION=2.1b6.dev1110

# Python 2.7 or 3.6 is supported by Ubuntu Bionic out of the box
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
        python${PYTHON_VERSION}-dev

#RUN if [[ "${PYTHON_VERSION}" == "3" ]]; then \
#        apt-get install -y python${PYTHON_VERSION}-distutils; \
#    fi
#RUN ln -s /usr/bin/python${PYTHON_VERSION} /usr/bin/python3

RUN curl -O https://bootstrap.pypa.io/pip/3.6/get-pip.py && \
    python3 get-pip.py && \
    rm get-pip.py

# Install TensorFlow, Keras, numpy, librosa, essentia
RUN pip install future typing cog matplotlib pandas seaborn
RUN pip install numpy==${NUMPY_VERSION} \
        tensorflow==${TENSORFLOW_VERSION} \
        librosa==${LIBROSA_VERSION} \
        keras==${KERAS_VERSION} \
        h5py==${H5PY_VERSION} \
        #essentia==${ESSENTIA_VERSION} \
        essentia-tensorflow==${ESSENTIA_VERSION}

#RUN pip install torch==${PYTORCH_VERSION} torchvision==${TORCHVISION_VERSION}

# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

# Install musicnn
RUN git clone https://github.com/jordipons/musicnn.git
COPY musicnn/setup.py /musicnn
RUN ls -la
RUN cd /musicnn && python3 setup.py install

# Install essentia scripts and models
RUN cd /
RUN git clone https://github.com/intamixx/matnn.git /tmp/matnn
RUN mv -v /tmp/matnn/musicnn/* /musicnn

# Get discogs effnet models
RUN cd /musicnn
RUN curl -L -o /musicnn/discogs-effnet-bs64-1.pb "https://essentia.upf.edu/models/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.pb"
RUN curl -L -o /musicnn/genre_discogs400-discogs-effnet-1.pb "https://essentia.upf.edu/models/classification-heads/genre_discogs400/genre_discogs400-discogs-effnet-1.pb"
RUN cd /musicnn/approach-engage
RUN mkdir -p /musicnn/approach-engage/models
RUN cd /musicnn/approach-engage/models
RUN curl -L -o /musicnn/approach-engage/models/discogs-effnet-bs64-1.pb "https://essentia.upf.edu/models/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.pb"
RUN curl -L -o /musicnn/approach-engage/models/approachability-2class.pb "https://essentia.upf.edu/models/classification-heads/approachability/approachability_2c-discogs-effnet-1.pb"
RUN curl -L -o /musicnn/approach-engage/models/engagement-2class.pb "https://essentia.upf.edu/models/classification-heads/engagement/engagement_2c-discogs-effnet-1.pb"
RUN curl -L -o /musicnn/approach-engage/models/approachability-3class.pb "https://essentia.upf.edu/models/classification-heads/approachability/approachability_3c-discogs-effnet-1.pb"
RUN curl -L -o /musicnn/approach-engage/models/engagement-3class.pb "https://essentia.upf.edu/models/classification-heads/engagement/engagement_3c-discogs-effnet-1.pb"
RUN curl -L -o /musicnn/approach-engage/models/approachability-regression.pb "https://essentia.upf.edu/models/classification-heads/approachability/approachability_regression-discogs-effnet-1.pb"
RUN curl -L -o /musicnn/approach-engage/models/engagement-regression.pb "https://essentia.upf.edu/models/classification-heads/engagement/engagement_regression-discogs-effnet-1.pb"

# Add web user with uid 1000

RUN useradd -ms /bin/bash web

# Change permissions to web

RUN chown web:web -Rv /musicnn
RUN chmod 750 -Rv /musicnn/*.py
RUN chmod 750 -Rv /musicnn/*.sh

WORKDIR "/musicnn"
CMD ["/musicnn/run.sh"]
