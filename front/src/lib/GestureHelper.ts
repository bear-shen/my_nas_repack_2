type GestureResType = pointerPlotType & {
    pointerMap: Map<number, pointerPlotType>;
};
type pointerPlotType = {
    plot_start: number[2],
    plot_middle: number[2],
    plot_current: number[2],
    time_start: number,
    length: number,
    degree: number,
    speed: number,
}
type GestureCallbackType = (gestureEvt: GestureResType, e: PointerEvent) => any;

export class GestureHelper {

    public dom: HTMLElement;
    public pointerMap = new Map<number, pointerPlotType>();

    constructor(dom: HTMLElement) {
        this.dom = dom;
        //
        this.dom.addEventListener("pointerdown", this.onPointerDown.bind(this));
        //
        this.dom.addEventListener("pointermove", this.onPointerMove.bind(this));
        //
        this.dom.addEventListener("pointerup", this.onPointerUp.bind(this));
        this.dom.addEventListener("pointercancel", this.onPointerUp.bind(this));
        this.dom.addEventListener("pointerout", this.onPointerUp.bind(this));
        // dom.dispatchEvent(new Event(''));
        // dom.addEventListener('',()=>{})
    }

    private onPointerDown(e: PointerEvent) {
        console.info(e, this);
        if (e.pointerType !== 'touch') return;
        const ifExs = this.pointerMap.get(e.pointerId);
        if (ifExs) return;
        const plot: pointerPlotType = {
            plot_start: [e.clientX, e.clientY],
            plot_middle: [e.clientX, e.clientY],
            plot_current: [e.clientX, e.clientY],
            time_start: new Date().valueOf(),
            length: 0,
            degree: 0,
            speed: 0,
        };
        this.pointerMap.set(e.pointerId, plot);
    }

    private onPointerMove(e: PointerEvent) {
        if (e.pointerType !== 'touch') return;
        const plot = this.pointerMap.get(e.pointerId);
        if (!plot) return;
        plot.plot_current = [e.clientX, e.clientY];
        plot.plot_middle = [
            (plot.plot_start[0] + plot.plot_current[0]) / 2,
            (plot.plot_start[1] + plot.plot_current[1]) / 2,
        ];
        let delta = {
            x: plot.plot_current[0] - plot.plot_start[0],
            y: plot.plot_current[1] - plot.plot_start[1],
            time: new Date().valueOf() - plot.time_start,
        };
        plot.length = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        plot.degree = 180 * Math.atan2(-1 * delta.y, delta.x) / Math.PI;
        if (plot.degree < 0) plot.degree = 360 + plot.degree;
        plot.speed = plot.length / (delta.time / 1000);
        //
        if (this.callbacks.move) {
            this.callbacks.move(
                this.processGesture(),
                e
            )
        }
    }

    private onPointerUp(e: PointerEvent) {
        if (e.pointerType !== 'touch') return;
        const plot = this.pointerMap.get(e.pointerId);
        if (!plot) return;
        if (this.pointerMap.size == 1 && this.callbacks.end) {
            this.callbacks.end(
                this.processGesture(),
                e
            )
        }
        this.pointerMap.delete(e.pointerId);
    }

    public processGesture(): GestureResType {
        const plot: GestureResType = {
            plot_start: [0, 0,],
            plot_middle: [0, 0,],//
            plot_current: [0, 0,],
            time_start: 0,
            length: 0,//
            degree: 0,//
            speed: 0,//
            pointerMap: this.pointerMap,
        };
        //
        if (!this.pointerMap.size) return plot;
        this.pointerMap.forEach((sPlot) => {
            plot.plot_start[0] += sPlot.plot_start[0];
            plot.plot_start[1] += sPlot.plot_start[1];
            plot.plot_current[0] += sPlot.plot_current[0];
            plot.plot_current[1] += sPlot.plot_current[1];
            plot.time_start = Math.min(sPlot.time_start);
        });
        plot.plot_start[0] /= this.pointerMap.size;
        plot.plot_start[1] /= this.pointerMap.size;
        plot.plot_current[0] /= this.pointerMap.size;
        plot.plot_current[1] /= this.pointerMap.size;
        //
        plot.plot_middle = [
            (plot.plot_start[0] + plot.plot_current[0]) / 2,
            (plot.plot_start[1] + plot.plot_current[1]) / 2,
        ];
        let delta = {
            x: plot.plot_current[0] - plot.plot_start[0],
            y: plot.plot_current[1] - plot.plot_start[1],
            time: new Date().valueOf() - plot.time_start,
        };
        plot.length = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        plot.degree = 180 * Math.atan2(-1 * delta.y, delta.x) / Math.PI;
        if (plot.degree < 0) plot.degree = 360 + plot.degree;
        plot.speed = plot.length / (delta.time / 1000);
        return plot;
    }

    private callbacks: { [key: string]: GestureCallbackType | null } = {
        move: null,
        end: null,
    };

    public onMove(callback: GestureCallbackType) {
        this.callbacks.move = callback;
    }

    public onEnd(callback: GestureCallbackType) {
        this.callbacks.end = callback;
    }

    public reset() {
        this.pointerMap.forEach(plot => {
            plot.plot_start = plot.plot_current;
            plot.plot_middle = plot.plot_current;
            plot.length = 0;
            plot.time_start = new Date().valueOf();
            plot.degree = 0;
            plot.speed = 0;
        })
    }

    public destory() {
        this.dom.removeEventListener("pointerup", this.onPointerUp.bind(this));
        this.dom.removeEventListener("pointercancel", this.onPointerUp.bind(this));
        this.dom.removeEventListener("pointerout", this.onPointerUp.bind(this));
        //
        this.dom.removeEventListener("pointermove", this.onPointerMove.bind(this));
        //
        this.dom.removeEventListener("pointerdown", this.onPointerDown.bind(this));
    }

}
