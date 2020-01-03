class Svg {
    constructor(container, width, height, margin) {
        this.margin = margin;

        // if (width == -1) {
        //     width = $(container).width();
        // }

        width = width - this.margin.left - this.margin.right;
        height = height - this.margin.top - this.margin.bottom;
        this.container = container;
        this.containerElem = d3.select(container);

        this.svg = d3.select(container)
            .append("svg");

        this.svg
            .attr("width", width)
            .attr("height", height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMinYMid')
            .append("g")
            .attr("class", "main-group")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    }

    get g(){return this.svg.select('.main-group');}

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get width(){return this.svg.attr("width"); }

    set width(width){
        this.svg.attr("width", width);
        this.height = Math.round(width / this.aspect);
    }

    get height(){return this.svg.attr("height"); }
    set height(height){this.svg.attr("height", height); }

    get margin(){return this._margin;}
    set margin(margin){this._margin = margin;}

    get container(){return this._container;}
    set container(container){this._container = container;}

    get containerElem(){return this._containerElem;}
    set containerElem(containerElem){this._containerElem = containerElem;}

    get aspect(){return this.width / this.height;}
}

