import { select } from 'd3-selection';
import { Observable, BehaviorSubject } from 'rxjs';
import { SideVals } from '../tools/SideVals';

export class Graph {
    constructor(rootSelector, options) {
        this._options = {
            margin: new SideVals((options || {}).margin || 40)
        };

        this._root = select(rootSelector);
        this._cont = this._root.append('g');
        this._cont
            .attr('transform', 'translate('+this._options.margin.left+','+this._options.margin.top+')')
            .classed('graphCont', true);

        this._redraw = new BehaviorSubject(this.drawContext);

//        window.on('resize', )

        Observable.fromEvent(window, 'resize')
            .throttleTime(1000)
            .do(x => console.log('resize', x))
            .map(evt => this.drawContext)
            .subscribe(x => this._redraw.next(x));
    }


    /**
     * @returns {BehaviorSubject|BehaviorSubject<any>}
     */
    get redrawSubject() {
        return this._redraw;
    }

    /**
     * @returns {*} d3-selection
     */
    get root() {
        return this._root;
    }

    /**
     * @returns {*} d3-selection
     */
    get cont() {
        return this._cont;
    }

    /**
     * @typedef {object} d3~DOMRect
     * @property {number} top
     * @property {number} left
     * @property {number} bottom
     * @property {number} right
     * @property {number} x
     * @property {number} y
     * @property {number} height
     * @property {number} width
     */

    /**
     * view rect
     * @returns {d3~DOMRect}
     */
    get viewRect() {
        return this._viewRect;
    }

    /**
     * sets view rect
     * @param {d3~DOMRect} rect
     */
    set viewRect(rect) {
        this._viewRect = rect || this._root.node().getBoundingClientRect();
        this.root.attr('width', this._viewRect.width);
        this.root.attr('height', this._viewRect.height);
    }

    syncSize() {
        this.viewRect = this._root.node().getBoundingClientRect();
        this._drawRect = {
            x: 0, y: 0,
            width: this.viewRect.width - this._options.margin.left - this._options.margin.right,
            height: this.viewRect.height - this._options.margin.top - this._options.margin.bottom
        }
    }

    /**
     *
     * @returns {{rect: d3~DOMRect, root: *}}
     */
    get drawContext() {
        this.syncSize();
        return {rect: this._drawRect, root: this.cont}
    }

}