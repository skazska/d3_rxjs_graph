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
            source.filter(evt => evt.event === 'balance').map(evt => {
                return evt.payload
                    .map( m => {
                        return {
                            precision: m[0], price: m[1], type: m[2] * 2 - 1, amount: m[3], count: m[4], amountDiff: m[5],
                            countDiff: m[6]
                        }
                    })
                    .sort( (prev, next) => {
                        return prev.price - next.price;
                    });
            })
        ).subscribe(
            ([{root, rect}, balance]) => {

                this.redrawBalance(balance, root,rect);

                //console.log(balance, root, rect)
            }
        );

        this.typeScale = scaleOrdinal(['red', 'green']).domain([1, -1]);

    }

    init () {

    }

    drawBalancePriceAxis(scale, balance, root, view) {
        handle(
            root.selectAll("g.priceAxis").data([view]),
            join => {
                return join.append("g").classed("priceAxis", true);
            },
            join => {
                const axis = axisLeft(scale).ticks(20);

                join.attr("transform", "translate(" + view.width + ", 0)")
                    .call(axis);

                join.selectAll("text")
//                    .attr("transform", "translate(-13, 20) rotate(-90)");

                return join;
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
                const yAxis = axisBottom(scale).ticks(5);
                // .tickSize();
                axis.attr("transform", "translate(" + view.x + ", " + view.height + ")")
                    .call(yAxis);

                return axis;
            }
        )
    }

    prepareData (balance) {
        return balance.map( (b, i, a) => {
            const prices = [ b.price, 0, a[i - b.type].price ];

            let
                priceFrom = prices[1 + b.type],
                priceTo = prices[1 - b.type];

            if (b.type !== a[i - b.type].type) {
                if (b.type < 0) {
                    priceTo = priceFrom + ( priceTo  - priceFrom) / 3;
                } else {
                    priceFrom = priceTo - ( priceTo  - priceFrom) / 3;
                }
            }
            return {
                o: b,
                height: this.amountScale(b.amount),
                count: this.countScale(b.count),
                position: this.priceScale(priceFrom),
                width: this.priceScale(priceFrom) - this.priceScale(priceTo),
                color: this.typeScale(b.type)
            }
        })
    }

    drawBalance (balance, root, view) {

        handle(
            root.selectAll("g.obBar").data(this.prepareData(balance)),
            bar => {
                const result = bar.append("g").classed("obBar", true);
                result.append("rect");
                result.append("path");
                result.append("text");

                return result;
            },
            bar => {
                bar.select("rect")
                    .attr("stroke", d => d.color)
                    .attr("height", d => d.width)
                    .attr("width", d => view.width - d.height);
                bar.select("path")
                    .attr("d", d => {
                        let path = "";
                        for (let i = 0; i < (d.count - 1); i++ ) {
                            path += "m"+Math.floor((view.width - d.height)/d.count)+" 0 l-3 "+d.width+" m0 -"+d.width+" ";
                        }
                        return path;
                    })
                    .attr("stroke", d => d.color);

                bar.select("text")
                    .attr("transform", "translate(-613,0)")
                    .text(d => ""+d.o.price+" - "+d.o.amount+" ("+d.o.count+") "+d.o.amountDiff);
                bar.attr("transform", d => "translate("+(view.x + d.height)+", "+(d.position - d.width)+")");

                return bar;
            },
            bar => {
                bar.remove();
            }
        );


    }

    redrawBalance (balance, root, view) {
        const
            balWidth = Math.floor(view.width * 1 / 4),
            balanceStats = balance.reduce(
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
            ),
            {bids, asks} = balance.reduce(
                (grp, item) => {
                    grp[item.type] = item;
                    return grp;
                },
                {bids: [], asks: []}
            );

        if (['minPrice', 'maxPrice'].some(p => {
            return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxPrice - this.stats.minPrice)
        }) || view.height !== this.height ) {
            this.stats.maxPrice = balanceStats.maxPrice;
            this.stats.minPrice = balanceStats.minPrice;

            this.priceScale = scaleLinear()
                .domain([this.stats.maxPrice, this.stats.minPrice])
                .range([0, view.height])
                .interpolate(interpolateRound);

            this.drawBalancePriceAxis(this.priceScale, balance, root, {width: view.width - balWidth, height: view.height});

        }

        if (['minCount', 'maxCount'].some(p => {
                return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxCount - this.stats.minCount)
            }) || view.width !== this.width ) {
            this.stats.maxCount = Math.max(balanceStats.maxCount, this.stats.maxCount || balanceStats.maxCount);
            this.stats.minCount = Math.min(balanceStats.minCount, this.stats.minCount || balanceStats.minCount);

            this.countScale = scalePow().exponent(0.33)
                .domain([0, this.stats.maxCount])
                .range([0, 10])
                .interpolate(interpolateRound);

        }

        if (['minAmount', 'maxAmount'].some(p => {
            return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxAmount - this.stats.minAmount)
        }) || view.width !== this.width ) {
            this.stats.maxAmount = Math.max(balanceStats.maxAmount, this.stats.maxAmount || balanceStats.maxAmount);
            this.stats.minAmount = Math.min(balanceStats.minAmount, this.stats.minAmount || balanceStats.minAmount);
            // const amount = Math.max(this.stats.minAmount , this.stats.maxAmount);

            this.amountScale = scalePow().exponent(0.33)
                .domain([0, this.stats.maxAmount])
                .range([balWidth - 10, 0])
                .interpolate(interpolateRound);

            this.drawBalanceAmountAxis(
                this.amountScale,
                balance,
                root,
                {x: view.width - balWidth + 10, y: 0, width: balWidth - 10, height: view.height}
            );
        }

        this.drawBalance(
            balance,
            root,
            {x: view.width - balWidth + 10, y: 0, width: balWidth - 10, height: view.height}
        );
    }



}
