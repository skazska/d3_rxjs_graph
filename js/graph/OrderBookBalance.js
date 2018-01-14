import { Observable } from 'rxjs';
import { RcWebsocketSubject } from "../comm/RcWebsocketSubject";
import { handle } from "../tools/d3";
import { axisBottom, axisTop, axisLeft, axisRight} from 'd3-axis';
import { scaleLinear, scalePoint, scaleBand, scaleOrdinal, scalePow  } from 'd3-scale';
import { interpolateRound } from "d3-interpolate";


export class OrderBookBalance {
    /**
     *
     * @param {Graph} graph
     * @param {RcWebsocketSubject} source
     */
    constructor(graph, source) {
        this.stats = {}; //{ minPrice: 0, maxPrice: 0, maxAmount: 0, minAmount: 0, maxCount: 0, minCount: 0 };
        this.width = 0;
        this.height = 0;


        this.subscription = Observable.combineLatest(
            graph.redrawSubject,
            source.filter(evt => evt.event === 'balance').map(evt => evt.payload)
        ).subscribe(
            ([{root, rect}, balance]) => {

                this.redrawBalance(balance, root,rect);

                //console.log(balance, root, rect)
            }
        );

        this.typeScale = scaleOrdinal(['red', 'green']).domain(['bid', 'ask']);

    }

    init () {

    }

    drawBalancePriceAxis(scale, balance, root, view) {
        handle(
            root.selectAll("g.priceAxis").data([view]),
            axis => {
                return axis.append("g").classed("priceAxis", true);
            },
            axis => {
                const xAxis = axisBottom(scale);

                axis.attr("transform", "translate(0," + view.height + ")")
                    .call(xAxis);

                axis.selectAll("text")
                    .attr("transform", "translate(-13, 20) rotate(-90)");

                return axis;
            }
        );
    }

    drawBalanceAmountAxis(scale, balance, root, view) {
        handle(
            root.selectAll("g.amountAxis").data([view]),
            axis => {
                return axis.append("g").classed("amountAxis", true);
            },
            axis => {
                const yAxis = axisRight(scale);
                // .tickSize();
                axis.attr("transform", "translate(" + view.width + ", 0)")
                    .call(yAxis);

                return axis;
            }
        )
    }

    drawBalance (balance, root, view) {
        let bWidth = this.priceScale.bandwidth();

        handle(
            root.selectAll("g.obBar").data(balance.sort( (p1, p2) => { return p1.price - p2.price} )),
            bar => {
                const result = bar.append("g").classed("obBar", true);
                result.append("rect");
                result.append("path");
                result.append("text");

                return result;
            },
            bar => {
                bar.select("rect")
                    .attr("stroke", d => this.typeScale(d.type))
                    .attr("width", bWidth)
                    .attr("height", d => this.amountScale(d.amount))
                bar.select("path")
                    .attr("d", d => {
                        let
                            rCnt = 10 / (this.stats.maxCount || 1000) * d.count ,
                            rHei = Math.floor(this.amountScale(d.amount)/rCnt),
                            path = "";

                        for (let i = 0; i < (rCnt - 1); i++ ) {
                            path += "m0 "+rHei+" l"+bWidth+" -3 m-"+bWidth+" 0 ";
                        }
                        return path;
                    })
                    .attr("stroke", d => this.typeScale(d.type));

                bar.select("text")
                    .attr("transform", "translate(13,0) rotate(-90) ")
                    .text(d => ""+d.amount+" ("+d.count+") "+d.amountDiff);
                bar.attr("transform", d => "translate("+this.priceScale(d.price)+", "+(view.height-this.amountScale(d.amount))+")");

                return bar;
            },
            bar => {
                bar.remove();
            }
        );


    }

    redrawBalance (balance, root, view) {
        const balanceStats = balance.reduce(
            (stats, item) => {
                if (stats.minPrice > item.price) stats.minPrice = item.price;
                if (stats.maxPrice < item.price) stats.maxPrice = item.price;
                if (stats.minAmount > item.amount) stats.minAmount = item.amount;
                if (stats.maxAmount < item.amount) stats.maxAmount = item.amount;
                if (stats.minCount > item.count) stats.minCount = item.count;
                if (stats.maxCount < item.count) stats.maxCount = item.count;
                return stats;
            },
            {
                minPrice: balance[0].price,
                maxPrice: balance[0].price,
                maxAmount: balance[0].amount,
                minAmount: balance[0].amount,
                maxCount: balance[0].count,
                minCount: balance[0].count
            }
        );

        if (['minPrice', 'maxPrice'].some(p => {
            return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxPrice - this.stats.minPrice)
        }) || view.width !== this.width ) {
            // this.priceScale = scalePoint()
            //     .domain(balance.map( item => item.price ).sort())
            //     .range([view.width, 0])
            //     .round(true);
            this.stats.maxPrice = balanceStats.maxPrice;
            this.stats.minPrice = balanceStats.minPrice;

            this.priceScale = scaleBand().padding(.05).round(true)
                .domain(balance.map( item => item.price ).sort())//([this.stats.minPrice, this.stats.maxPrice])
                .range([0, view.width]);

            this.drawBalancePriceAxis(this.priceScale, balance, root, view);

        }

        if (['minAmount', 'maxAmount'].some(p => {
            return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxAmount - this.stats.minAmount)
        }) || view.height !== this.height ) {
            this.stats.maxAmount = Math.max(balanceStats.maxAmount, this.stats.maxAmount || balanceStats.maxAmount);
            this.stats.minAmount = Math.min(balanceStats.minAmount, this.stats.minAmount || balanceStats.minAmount);
            this.stats.maxCount = Math.max(balanceStats.maxCount, this.stats.maxCount || balanceStats.maxCount);
            this.stats.minCount = Math.min(balanceStats.minCount, this.stats.minCount || balanceStats.minCount);
            const amount = Math.max(-this.stats.minAmount , this.stats.maxAmount);

            this.amountScale = scalePow().exponent(0.25)
                .domain([amount, -amount])
                .range([0, view.height])
                .interpolate(interpolateRound);

            this.drawBalanceAmountAxis(this.amountScale, balance, root, view);
        }

        this.drawBalance(balance, root,view);

    }



}
