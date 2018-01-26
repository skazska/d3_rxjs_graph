import Rx from "rxjs/Rx";
import { select } from "d3-selection";

import { RcWebsocketSubject } from "./comm/RcWebsocketSubject";
import { Graph } from "./graph/Graph";
import { OrderBookBalance } from "./graph/OrderBookBalance";


//import * as d3 from 'd3';

const
    wsUrl = "ws://localhost:3000",
    protocol = ["protocolOne", "protocolTwo"];


export function bootstrap() {
    // bootstrap code here
    console.log('Hi there!!!');

    const
        graph = new Graph("#graph>svg", {margin: {top: 30, right: 80, bottom: 30, left: 30}}),
        source = new RcWebsocketSubject(wsUrl),
        wi = new OrderBookBalance(graph, source);

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

