# First, we index all the cities. This will write to `data` folder
# PBF files. Would probably take a few hours to download all city boundaries
# from cities.txt
node index.js cities.txt

# Let's extract the areaId -> City name to pbfNames.json file
node pbf_to_name.js data

# now, compute the embeddings by random walks. The embeddings are
# saved into data-emb folder. This should probably take around an hour
node embedGraph.js data

# Once embeddings are computed, let's dump the distance matrix for each graph:
# This is O(n^2), where `n` is number of cities
node computeDistanceMatrix.js > distances.txt

# The final step will give us a graph of nearest neighbors:
# The grpah is saved into `distance.dot` file
node distancesToGraph.js distances.txt


## You are done. I have also used
# node generateImages.js
## to construct screenshots, but that is optional

