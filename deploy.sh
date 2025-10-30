#!/bin/sh

set -e

echo "Building the Docker image..."
docker build -t aloisogomes/proposal-system:1.0.14 .

echo "Pushing the Docker image..."
docker push aloisogomes/proposal-system:1.0.14