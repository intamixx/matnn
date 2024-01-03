#!/bin/bash

# download discogs effnet model and TL-based models
curl -L -o models/discogs-effnet-bs64-1.pb "https://essentia.upf.edu/models/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.pb"
curl -L -o models/approachability-2class.pb "https://essentia.upf.edu/models/classification-heads/approachability/approachability_2c-discogs-effnet-1.pb"
curl -L -o models/engagement-2class.pb "https://essentia.upf.edu/models/classification-heads/engagement/engagement_2c-discogs-effnet-1.pb"
curl -L -o models/approachability-3class.pb "https://essentia.upf.edu/models/classification-heads/approachability/approachability_3c-discogs-effnet-1.pb"
curl -L -o models/engagement-3class.pb "https://essentia.upf.edu/models/classification-heads/engagement/engagement_3c-discogs-effnet-1.pb"
curl -L -o models/approachability-regression.pb "https://essentia.upf.edu/models/classification-heads/approachability/approachability_regression-discogs-effnet-1.pb"
curl -L -o models/engagement-regression.pb "https://essentia.upf.edu/models/classification-heads/engagement/engagement_regression-discogs-effnet-1.pb"
