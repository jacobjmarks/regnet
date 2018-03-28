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

module.exports.getGenes = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genes?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving genes.");
        let genes = JSON.parse(body)["gene"];
        return cb(null, genes.length ? genes : [genes]);
    })
}

module.exports.getRegulators = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulators?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulator.");
        body = JSON.parse(body);
        let regulators = body && body["regulator"];
        if (!regulators) return cb(null, null);
        return cb(null, regulators.length ? regulators : [regulators]);
    })
}

module.exports.getSites = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/sites?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving sites.");
        let sites = JSON.parse(body)["site"];
        return cb(null, sites.length ? sites : [sites]);
    })
}

module.exports.geneRegulationNetwork = (genomeId, type, cb) => {
    let network = {
        genomeId: genomeId,
        regulators: []
    };

    this.getRegulons(genomeId, (err, regulons) => {
        if (err) return cb(err);

        let regulatorCount = regulons.length;

        for (let regulon of regulons) {
            this.getRegulators(regulon.regulonId, (err, regulators) => {
                if (err) return cb(err);
                if (!regulators) {
                    regulatorCount--;
                    // console.log("NO REGULATORS FOR REGULON: " + regulon.regulonId);
                    return;
                }
                
                let regulator = regulators[0];
                regulator.genes = [];

                this.getGenes(regulon.regulonId, (err, genes) => {
                    if (err) return cb(err);

                    for (let gene of genes) {
                        if (gene.vimssId != regulator.vimssId) {
                            regulator.genes.push(gene);
                        } else {
                            regulator.function = gene.function;
                        }
                    }

                    network.regulators.push(regulator);

                    if (network.regulators.length == regulatorCount) {
                        network.regulators.sort((a, b) => a.vimssId - b.vimssId);
                        
                        switch(type) {
                            case "dot":
                                // generateDotGraph(network, (graph) => {
                                //     cb(null, graph);
                                // })
                                // break;
                            case "json":
                            default:
                                cb(null, network)
                        }
                    }
                })
            })
        }
    })
}

function generateDotGraph(network, cb) {
    let graph = `digraph G {
        node [color=black,style=bold];
        edge [color=black,style=bold];\n`;

    graph += `${network.genomeId} [label="Genome ${network.genomeId}"];\n`;
    graph += `${network.genomeId} -> {${network.regulons.map((r) => r.regulonId).join(' ')}}\n`;

    for (let regulon of network.regulons) {
        let id = regulon.regulonId;
        graph += `${id} [label="(${regulon.regulationType})\\n${regulon.regulatorFamily}:${regulon.regulatorName}"]\n`;
        graph += `subgraph cluster_${id} {
            node [style=solid];
            edge [color="${randomColor({seed: id, luminosity: "bright"})}",style=solid];
            ${id} -> { ${regulon.sites.map((s) => s.geneVIMSSId).join(' ')} }
        }\n`;
    }
    
    graph += '}';

    cb(graph);
}

// module.exports.genomeNetwork = (genomeId, type, cb) => {
//     let network = {
//         genomeId: genomeId,
//         regulons: []
//     };

//     let regulonCount = 0;

//     let addNode = (regulon, sites) => {
//         regulon.sites = sites;
//         network.regulons.push(regulon);        
//         if (network.regulons.length == regulonCount) {
//             switch(type) {
//                 case "dot":
//                     generateDotGraph(network, (graph) => {
//                         cb(null, graph);
//                     })
//                     break;
//                 case "json":
//                 default:
//                     cb(null, network)
//             }
//         }
//     }

//     this.getRegulons(genomeId, (err, regulons) => {
//         if (err) return cb(err);
//         regulonCount = regulons.length;
//         for (let regulon of regulons) {
//             this.getSites(regulon["regulonId"], (err, sites) => {
//                 addNode(regulon, (!err) ? sites : null);
//             })
//         }
//     })
// }

// function generateDotGraph(network, cb) {
//     let graph = `digraph G {
//         node [color=black,style=bold];
//         edge [color=black,style=bold];\n`;

//     graph += `${network.genomeId} [label="Genome ${network.genomeId}"];\n`;
//     graph += `${network.genomeId} -> {${network.regulons.map((r) => r.regulonId).join(' ')}}\n`;

//     for (let regulon of network.regulons) {
//         let id = regulon.regulonId;
//         graph += `${id} [label="(${regulon.regulationType})\\n${regulon.regulatorFamily}:${regulon.regulatorName}"]\n`;
//         graph += `subgraph cluster_${id} {
//             node [style=solid];
//             edge [color="${randomColor({seed: id, luminosity: "bright"})}",style=solid];
//             ${id} -> { ${regulon.sites.map((s) => s.geneVIMSSId).join(' ')} }
//         }\n`;
//     }
    
//     graph += '}';

//     cb(graph);
// }