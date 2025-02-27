FROM node:18

ARG DEBIAN_FRONTEND=noninteractive

# Install necessary tools and Python
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
        git \
        procps \
        curl \
        wget \
        build-essential \
        python3 \
        python3-pip \
        ca-certificates \
        gnupg 

RUN curl https://install.meteor.com/ | sh 
    # Verify Meteor installation
    # && meteor --version \
    # # Cleanup
    # && apt-get clean \
RUN rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/*

# Set working directory
WORKDIR /workspaces

# Set default shell
SHELL ["/bin/bash", "-c"]

# Create a non-root user with the same name as node
# RUN useradd -m -s /bin/bash -u 1000 node \
#     && chown -R node:node /workspaces

# USER node
