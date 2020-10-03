class Svg {
    constructor(container, width, height, margin) {
        this.margin = margin;

        width = width - this.margin.left - this.margin.right;
        height = height - this.margin.top - this.margin.bottom;
        this.container = container;
        this.containerElem = d3.select(container);

        this.svg = d3.select(container)
            .append("svg");

        this.svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "main-group")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    }

    get g(){return this._svg.select('.main-group'); }

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get width(){return this.svg.attr("width"); }
    get height(){return this.svg.attr("height"); }

    get margin(){return this._margin;}
    set margin(margin){this._margin = margin;}

    get container(){return this._container;}
    set container(container){this._container = container;}

    get containerElem(){return this._containerElem;}
    set containerElem(containerElem){this._containerElem = containerElem;}

}

class SvgBarChart {
    constructor(container, width, height, margin) {
        this._width = width - margin.left - margin.right;
        this._height = height - margin.top - margin.bottom;
        this._margin = margin;

        this._svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "main-group")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    get g(){return this._svg.select('.ç'); }

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get width(){return this._width;}
    set width(width){this._width = width;}

    get height(){return this._height;}
    set height(height){this._height = height;}

    get margin(){return this._margin;}
    set margin(margin){this._margin = margin;}
}

