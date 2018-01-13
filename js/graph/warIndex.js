import { Observable } from 'rxjs';
import { RcWebsocketSubject } from "../comm/RcWebsocketSubject";
import { axisBottom, axisTop, axisLeft, axisRight} from 'd3-axis';
import { scaleLinear, scalePoint, scaleOrdinal } from 'd3-scale';
import { interpolateRound } from "d3-interpolate";


export class WarIndex {
    /**
     *
     * @param {Graph} graph
     * @param {RcWebsocketSubject} source
     */
    constructor(graph, source) {
        this.stats = { minPrice: 0, maxPrice: 0, maxAmount: 0, minAmount: 0, maxCount: 0, minCount: 0 };
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

        const xAxis = axisBottom(scale);

        this.priceAxisJoin = root.selectAll("g.priceAxis").data([view]);
        this.priceAxisJoin.attr("transform", "translate(0," + view.height + ")").call(xAxis);

        const axis = this.priceAxisJoin.enter().append("g")
            .classed("priceAxis", true)
            .attr("transform", "translate(0," + view.height + ")")
            .call(xAxis);

        axis.selectAll("text")
            .attr("transform", "translate(10, 10) rotate(30)");
    }

    drawBalanceAmountAxis(scale, balance, root, view) {

        const yAxis = axisRight(scale);
        // .tickSize();

        this.amountAxisJoin = root.selectAll("g.amountAxis").data([view]);
        this.amountAxisJoin
            //.attr("transform", "translate(0," + view.width + ")")
            .call(yAxis);

        this.amountAxisJoin.enter().append("g")
            .classed("amountAxis", true)
            .attr("transform", "translate(" + view.width + ", 0)")
            .call(yAxis);

    }

    drawBalanceCountAxis(scale, balance, root, view) {
        const y2Scale = scaleLinear()
            .domain([dataStats.minCount, dataStats.maxCount])
            .range([0, view.height]);

    }

    drawBalance (balance, root, view) {

        const paths = ['bid', 'ask']
            .map( tp => {
                return {
                    path: balance
                        .filter(item => item.type === tp)
                        .map((p, i) => {
                            return (i === 0 ? "M" : "L") + this.priceScale(p.price) + " " + this.amountScale(p.amount);
                        })
                        .join(" "),
                    type: tp
                }
            });
        const bals = root.selectAll("path.balancePath").data(paths);
        bals
            .attr("d", d => d.path)
            .classed("balancePath", true)
            .attr("fill", "transparent")
            .attr("stroke", d => this.typeScale(d.type));
        bals.enter()
            .append("path")
            .classed("balancePath", true)
            .attr("d", d => d.path)
            .attr("fill", "transparent")
            .attr("stroke", d => this.typeScale(d.type));
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
            { minPrice: 0, maxPrice: 0, maxAmount: 0, minAmount: 0, maxCount: 0, minCount: 0 }
        );

        if (['minPrice', 'maxPrice'].some(p => {
            return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxPrice - this.stats.minPrice)
        }) || view.width !== this.width ) {
            this.priceScale = scalePoint()
                .domain(balance.map( item => item.price ))
                .range([view.width, 0])
                .round(true);

            this.drawBalancePriceAxis(this.priceScale, balance, root, view);
            this.stats.maxPrice = balanceStats.maxPrice;
            this.stats.minPrice = balanceStats.minPrice;

        }

        if (['minAmount', 'maxAmount'].some(p => {
            return Math.abs(balanceStats[p] - this.stats[p]) > 0.05 * (this.stats.maxAmount - this.stats.minAmount)
        }) || view.height !== this.height ) {
            const amount = Math.max(-balanceStats.minAmount, balanceStats.maxAmount);
            this.amountScale = scaleLinear()
                .domain([amount, -amount])
                .range([0, view.height])
                .interpolate(interpolateRound);

            this.drawBalanceAmountAxis(this.amountScale, balance, root, view);
            this.stats.maxAmount = Math.max(balanceStats.maxAmount, this.stats.maxAmount);
            this.stats.minAmount = Math.min(balanceStats.minAmount, this.stats.minAmount);
        }

        this.drawBalance(balance, root,view);

    }



}
