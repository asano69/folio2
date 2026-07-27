#!/usr/bin/env bash

set -euo pipefail
ssh -o RemoteCommand=none castor 'docker exec komodo km execute --yes run-build folio'
