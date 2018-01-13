import Rx from "rxjs/Rx";
import { select } from "d3-selection";

import { RcWebsocketSubject } from "./comm/RcWebsocketSubject";
import { Graph } from "./graph/Graph";
import { WarIndex } from "./graph/warIndex";


//import * as d3 from 'd3';

const
    wsUrl = "ws://localhost:3000",
    protocol = ["protocolOne", "protocolTwo"];


export function bootstrap() {
    // bootstrap code here
    console.log('Hi there!!!');

    const
        graph = new Graph("#graph>svg", {margin: 50}),
        source = new RcWebsocketSubject(wsUrl),
        wi = new WarIndex(graph, source);

    source.connectionStatus.subscribe((isConnected) => {
        console.log('connected: ', isConnected);
        if (isConnected) {


        }
    });


    return {
        rx: Rx,
        source: source,
        graph: graph,
        wi: wi
    }
}

