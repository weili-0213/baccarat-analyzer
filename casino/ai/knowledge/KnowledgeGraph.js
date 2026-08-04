/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/KnowledgeGraph.js
 */

export const KNOWLEDGE_GRAPH_VERSION = "7.2.0";

export default class KnowledgeGraph {
    constructor() {
        this.nodes =
            new Map();

        this.edges = [];
    }

    addNode(
        id,
        data = {}
    ) {
        this.nodes.set(
            id,
            {
                id,
                ...data
            }
        );

        return this.nodes.get(
            id
        );
    }

    addEdge(
        from,
        to,
        relation,
        weight = 1
    ) {
        if (
            !this.nodes.has(from) ||
            !this.nodes.has(to)
        ) {
            throw new Error(
                "KnowledgeGraph edge requires existing nodes."
            );
        }

        const edge = {
            from,
            to,
            relation,
            weight
        };

        this.edges.push(
            edge
        );

        return edge;
    }

    neighbors(id) {
        return this.edges
            .filter(
                edge =>
                    edge.from === id ||
                    edge.to === id
            )
            .map(
                edge => ({
                    edge,

                    node:
                        this.nodes.get(
                            edge.from === id
                                ? edge.to
                                : edge.from
                        ) ??
                        null
                })
            );
    }

    clear() {
        this.nodes.clear();
        this.edges = [];

        return this;
    }

    get summary() {
        return {
            version:
                KNOWLEDGE_GRAPH_VERSION,

            nodeCount:
                this.nodes.size,

            edgeCount:
                this.edges.length
        };
    }
}
