export class SideVals {
    /**
     * creates sideVals definition data object
     * @class
     * @param args - could be (anySide|anyCorners) or (top-right, bottom-left) or
     *   (topLeft-bottomRight, topRight-bottomLeft) or (top,right-left, bottom) or
     *   (topLeft, topRight-bottomLeft, bottomRight) or (top,right, bottom, left) or
     *   (topLeft, topRight, bottomRight, bottomLeft) or ({top,right, bottom, left}) or
     *   ({topLeft, topRight, bottomRight, bottomLeft})
     */
    constructor(...args) {
        this.setAll.apply(this, args);
    }

    /**
     * @property {number} top
     */
    set top (top) { this._top = top; }
    get top () { return this._top || 0; }

    /**
     * @property right
     */
    set right (right) { this._right = right; }
    get right () { return this._right || 0; }

    /**
     * @property bottom
     */
    set bottom (bottom) { this._bottom = bottom; }
    get bottom () { return this._bottom || 0; }

    /**
     * @property left
     */
    set left (left) { this._left = left; }
    get left () { return this._left || 0; }


    /**
     * @property topLeft
     */
    set topLeft (topLeft) { this._top = topLeft; }
    get topLeft () { return this._top || 0; }

    /**
     * @property topRight
     */
    set topRight (topRight) { this._right = topRight; }
    get topRight () { return this._right || 0; }

    /**
     * @property bottomRight
     */
    set bottomRight (bottomRight) { this._bottom = bottomRight; }
    get bottomRight () { return this._bottom || 0; }

    /**
     * @property bottomLeft
     */
    set bottomLeft (bottomLeft) { this._left = bottomLeft; }
    get bottomLeft () { return this._left || 0; }

    /**
     * sets new vals
     * @param args - could be (anySide|anyCorners) or (top-right, bottom-left) or
     *   (topLeft-bottomRight, topRight-bottomLeft) or (top,right-left, bottom) or
     *   (topLeft, topRight-bottomLeft, bottomRight) or (top,right, bottom, left) or
     *   (topLeft, topRight, bottomRight, bottomLeft) or ({top,right, bottom, left}) or
     *   ({topLeft, topRight, bottomRight, bottomLeft})
     * @returns {SideVals}
     */
    setAll(...args) {
        if (typeof args[0] === 'number') {
            this._top = args[0];
            if (args.length === 1) {
                this._right = args[0];
                this._bottom = args[0];
                this._left = args[0];
            } else if (args.length === 2) {
                this._right = args[1];
                this._bottom(args[0]);
                this._left(args[1]);
            } else if (args.length === 3) {
                this._right(args[1]);
                this._bottom(args[2]);
                this._left(args[1]);
            } else {
                this._right(args[1]);
                this._bottom(args[2]);
                this._left(args[3]);
            }
        } else {
            if (args[0].top || args[0].topLeft) this._top = args[0].top || args[0].topLeft;
            if (args[0].right || args[0].topRight) this._right = args[0].right || args[0].topRight;
            if (args[0].bottom || args[0].bottomRight) this._bottom = args[0].bottom || args[0].bottomRight;
            if (args[0].left || args[0].bottomLeft) this._left = args[0].left || args[0].bottomLeft;
        }
        return this;
    }
}
      
