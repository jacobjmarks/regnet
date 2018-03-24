const request = require("request");
const randomColor = require("randomcolor");

module.exports.getGenomes = (cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genomeStats`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving genomes.");
        let genomes = JSON.parse(body)["genomeStat"];
        return cb(null, genomes.length ? genomes : [genomes]);
    })
}

module.exports.getRegulons = (genomeId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulons?genomeId=${genomeId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulons.");
        let regulons = JSON.parse(body)["regulon"];
        return cb(null, regulons.length ? regulons : [regulons]);
    })
}

module.exports.getSites = (regulonId, cb) => {

    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/sites?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulons.");
        let sites = JSON.parse(body)["site"];
        return cb(null, sites.length ? sites : [sites]);
    })
}

module.exports.genomeNetwork = (genomeId, type, cb) => {
    let network = {
        genomeId: genomeId,
        regulons: []
    };

    let regulonCount = 0;

    let addNode = (regulon, sites) => {
        regulon.sites = sites;
        network.regulons.push(regulon);        
        if (network.regulons.length == regulonCount) {
            switch(type) {
                case "dot":
                    generateDotGraph(network, (graph) => {
                        cb(null, graph);
                    })
                    break;
                case "json":
                default:
                    cb(null, network)
            }
        }
    }

    this.getRegulons(genomeId, (err, regulons) => {
        if (err) return cb(err);
        regulonCount = regulons.length;
        for (let regulon of regulons) {
            this.getSites(regulon["regulonId"], (err, sites) => {
                addNode(regulon, (!err) ? sites : null);
            })
        }
    })
}

function generateDotGraph(network, cb) {
    function addChildren(parent, children) {
        return `${parent} -> { ${children.join(' ')} }`;
    }

    let graph = `digraph ${network.genomeId} { node [color=black]; edge [color=black];\n`;

    graph += `${network.genomeId}[label="Genome ${network.genomeId}"];`;
    graph += addChildren(network.genomeId, network.regulons.map((r) => r.regulonId));
    graph += '\n';

    for (let regulon of network.regulons) {
        let id = regulon.regulonId;
        graph += `subgraph cluster_${id} { edge [color="${randomColor({seed: id, luminosity: "bright"})}"]; ${
            addChildren(id, regulon.sites.map((s) => s.geneVIMSSId))
        } }\n`;
    }
    
    graph += '}';

    cb(graph);
}