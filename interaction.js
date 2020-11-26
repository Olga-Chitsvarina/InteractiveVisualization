
    // let d3 = import(d3.js);
    /**
    * copied from the following resources:
    * http://bl.ocks.org/micahstubbs/281d7b7a7e39a9b59cf80f1b8bd41a72
    * http://bl.ocks.org/msbarry/9911363
    * http://bl.ocks.org/weiglemc/6185069
     *
     * References:
     * Tooltips: https://www.d3-graph-gallery.com/graph/heatmap_tooltip.html
     * Tooltip position: https://stackoverflow.com/questions/13190207/how-do-i-get-the-x-y-coordinates-of-the-center-of-the-circle-the-user-mouses-ove
     * Adding labels: http://www.d3noob.org/2012/12/adding-axis-labels-to-d3js-graph.html
     * Dim background: https://github.com/andywer/jquery-dim-background
     * Assign events to element that does not exist: https://stackoverflow.com/questions/15092578/on-vs-live-click-function-on-element-that-doesnt-exist-yet
     * Darken color https://github.com/bgrins/TinyColor
     **/

    const margin = {top: 0, right: 0, bottom: 0, left: 0};
    const width = 960 - margin.left - margin.right;
    const height = 1000 - margin.top - margin.bottom;

    const color = d3.scaleThreshold()
    .domain([2, 3, 4, 5, 6, 7, 8])
    .range( d3.schemeBlues[7] )
    .unknown(d3.rgb(255,200,200));

    var tooltip = d3.select("#my-tooltip")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("background-color", "white")
        .style("padding", "5px")
        .style("visibility", "hidden")

    const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('position', 'absolute')
    .style('top', "50px")

    const map = svg
    .append('g')
    .attr('class', 'map');

    const scatterplot = svg
    .append('g')
    .attr('class', 'scatterplot')
    .attr("transform", "translate(100,550)");

    const projection = d3.geoMercator()
    .scale(130)
    .translate( [width / 2, height / 1.5/2]);

    const path = d3.geoPath().projection(projection);

    Promise.all([
    d3.csv('who.csv'),
    d3.json('world_countries.json'),
    d3.tsv('world_population.tsv')
    ]).then(function(data) {
    const fertilityById = {};

    let who = data[0];
    let countries = data[1];
    let population = data[2];

    let fieldColor = 'Total fertility rate (per woman)';
    let fieldXAxis = "Urban_population_growth";
    let fieldYAxis = "Urban_population_pct_of_total";

    who.forEach(d => {
    if(d[fieldColor] == '') {
    d[fieldColor] = undefined;
};
});

    population.forEach(d =>
{
    var res = who.find(e =>
{
    return e.Country == d.name;
});
    if(typeof res !== 'undefined') {
    res.id = d.id;
}
});

    who.forEach(d => { fertilityById[d.id] = +d[fieldColor]; });
    countries.features.forEach(d => { d.population = fertilityById[d.id] });

    svg.append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(countries.features)
    .enter().append('path')
    .attr("class", d => "CLEAN-COUNTRY-NAME-" + clean_country_name(d.properties.name))
    .attr('d', path)
    .style('fill', d => color(fertilityById[d.id]))
    .style('stroke', 'white')
    .style('opacity', 0.8)
    .style('stroke-width', 0.3)
    .on('mouseover',function(d){
        add_tooltip(tooltip, d.properties.name,event.clientX + 10, event.clientY )
        add_border(clean_country_name(d.properties.name), tinycolor(color(fertilityById[d.id])).darken(15).toString());
    })
    .on('mouseleave', function(d){
        remove_tooltip_and_border(clean_country_name(d.properties.name), tooltip)
    })
    .on('click', function(d){
        let country_name =  d.properties.name
        handle_click(clean_country_name(d.properties.name), width, height, country_name)
    })

    svg.append('path')
    .datum(topojson.mesh(countries.features, (a, b) => a.id !== b.id))
    .attr('class', 'names')
    .attr('d', path);

    // setup x
    var xValue = function(d) { return d[fieldXAxis];}, // data -> value
    xScale = d3.scaleLinear().range([0, height/2-100]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.axisBottom().scale(xScale);

    // setup y
    var yValue = function(d) { return d[fieldYAxis];}, // data -> value
    yScale = d3.scaleLinear().range([height/2-100, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.axisLeft().scale(yScale);

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([-2, 8]);
    yScale.domain([0, 100]);

    // x-axis
    scatterplot.append("g")
    .attr("class", "x axis")
    .call(xAxis)
    .attr("transform", "translate(0," + (height/2-100) + ")")

    scatterplot.append("text")
    .attr("class", "label")
    .attr("x", xScale(8))
    .attr("y", -6)
    .attr("transform", "translate(0," + (height/2-100) + ")")
    .style("text-anchor", "end")
    .text(fieldXAxis.replace(/_/g, " "));

    // y-axis
    scatterplot.append("g")
    .attr("class", "y axis")
    .call(yAxis)

    scatterplot.append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("x", 0)
    .attr("y", yScale(100))
    .attr("dy", "1.5em")
    .style("text-anchor", "end")
    .text(fieldYAxis.replace(/_/g, " "));

    // draw dots
    scatterplot.selectAll(".dot")
    .data(who)
    .enter().append("circle")
    .attr("class", d => { return "dot CLEAN-DOT-NAME-" + clean_country_name(d.Country) } )
    .attr("r", 3.5)
    .attr("cx", xMap)
    .attr("cy", yMap)
    .style("fill", function(d) { return color(d[fieldColor]);})
    .on('mouseleave', function(d){
        remove_tooltip_and_border(clean_country_name(d.Country), tooltip)
    })
    .on('mouseover', function(d) {
        var scatterplotPos = $('.scatterplot').offset()
        add_tooltip(tooltip, d.Country, scatterplotPos.left + this.cx.baseVal.value + 70, scatterplotPos.top + this.cy.baseVal.value )
        add_border(clean_country_name(d.Country), tinycolor(color(d[fieldColor])).darken(15).toString());
    })
    .on('click', function(d){
        var country_name = d.Country
        handle_click(clean_country_name(d.Country), width, height, country_name)
    })

    // draw legend
    var legend = scatterplot.append("g").attr("class", "legend-group").selectAll(".legend")
    .data(color.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(-100," + (i+1) * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
    .attr("x", width/2 + 4)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d,i)=> color(d-0.0001));

    // draw legend text
    legend.append("text")
    .attr("x", width/2 - 3)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { return "< "+d;});

    scatterplot.select("g.legend-group")
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(-100,0)")
    .append("text")
    .attr("x", width/2+22)
    .attr("y", 0)
    .attr("dy", "1.5em")
    .style("text-anchor", "end")
    .text(fieldColor);

    var $page_tooltip = $("#my-tooltip");
    $page_tooltip.parent().append($page_tooltip);
});

function add_border(id, my_color) {
    var my_country = $(".CLEAN-COUNTRY-NAME-"+id)
    var my_dot = $(".CLEAN-DOT-NAME-" + id)

    my_country.css('stroke-width', "2.75")
    my_country.css('stroke', my_color)
    my_dot.css('stroke-width', "2.75")
    my_dot.css('stroke', my_color)
}

function add_tooltip(tooltip, country_name, left, top){
    my_data = ["Country/Territory: " + country_name ]

    dot_data = d3.select(".CLEAN-DOT-NAME-" + clean_country_name(country_name)).data()[0]
    country_data = d3.select(".CLEAN-COUNTRY-NAME-" + clean_country_name(country_name)).data()[0]

    if (country_data !== undefined){
        my_data.push("Population: " + country_data.population)
    }

    if (dot_data !== undefined){
        my_data.push( "Total fertility rate (per woman): " + dot_data["Total fertility rate (per woman)"])
        my_data.push( "Urban population growth: " + dot_data["Urban_population_growth"])
        my_data.push("Urban population pct of total: " + dot_data["Urban_population_pct_of_total"])
    }

    my_data = my_data.join("<br/>");

    tooltip
        .html(my_data)
        .style("position", "absolute")
        .style("left", left + "px")
        .style("top", top + "px")
        .style("opacity", 1)
        .style("visibility", "visible")
}

function remove_tooltip_and_border(id, tooltip){
    var my_country = $(".CLEAN-COUNTRY-NAME-"+id)
    var my_dot = $(".CLEAN-DOT-NAME-" + id)

    my_country.css('stroke-width', "0.3")
    my_country.css('stroke', "white")
    tooltip.style("visibility", "hidden")
    my_dot.css('stroke', 'none')
}

function handle_click(id, width, height, country_name){
    var my_country = $(".CLEAN-COUNTRY-NAME-"+id).clone()
    var my_dot = $(".CLEAN-DOT-NAME-" + id).clone()

    let my_data = "Some data is missing for country " + country_name
    dot_data = d3.select(".CLEAN-DOT-NAME-" + id).data()[0]
    country_data = d3.select(".CLEAN-COUNTRY-NAME-" + id).data()[0]

    if (dot_data !== undefined && country_data !== undefined) {
        my_data = [
            "Country/Territory: " + country_data .properties.name,
            "Population: " + country_data.population ,
            "Population growth: " + dot_data.Population_growth,
            "Population annual growth rate (%): " + dot_data["Population annual growth rate (%)"],
            "Urban population growth: " + dot_data["Urban_population_growth"],
            "Urban population pct of total: " + dot_data["Urban_population_pct_of_total"],
            "Population in urban areas (%): " + dot_data["Population in urban areas (%)"],
            "Population in urban agglomerations more than 1 million: " + dot_data["Population_in_urban_agglomerations_more_than_1_million"],
            "Population median age (years): " + dot_data["Population median age (years)"],
            "Total fertility rate (per woman): " + dot_data["Total fertility rate (per woman)"],
            "Life expectancy at birth (years) female: " + dot_data["Life expectancy at birth (years) female"],
            "Life expectancy at birth (years) male: " + dot_data["Life expectancy at birth (years) male"],
            "Contraceptive_use: " + dot_data["Contraceptive_use"],
            "Hospital beds (per 10 000 population): " + dot_data["Hospital beds (per 10 000 population)"],
            "Adult literacy rate (%): " + dot_data["Adult literacy rate (%)"] ].join("<br/>");
    }

    d3.select('body')
        .append('svg')
        .attr('class', 'svg-to-remove')
        .attr('width', width)
        .attr('height', height)
        .style("z-index", 1000 )
        .style('position', 'absolute')
        .style('top', "50px")
        .on('click', function(){
            $(".svg-to-remove" ).undim()
            $(".svg-to-remove" ).remove()
        })

    $(".svg-to-remove").dimBackground({
        darkness : 0.8
    }, function() {
        $(".dimbackground-curtain" ).on( "click", function(){
            $(".svg-to-remove" ).undim()
            $(".svg-to-remove" ).remove()
        } ); } );


    $(".svg-to-remove").append(my_country)
    $(".svg-to-remove").append(my_dot)

    d3.select(".svg-to-remove circle")
        .attr("cx", 100 + parseFloat(my_dot.attr('cx')))
        .attr("cy",550 + parseFloat(my_dot.attr('cy')))

    d3.select(".dimbackground-curtain")
        .append("div")
        .html(my_data)
        .style("margin-left", 10 + "px")
        .style("margin-top", 10 + "px")
        .style("background-color", "#F0F0F0")
        .style("border", "solid")
        .style("max-width", "300px")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px")
}

function clean_country_name(country_name){
    return country_name.replace(/\s/g, '').replace(/[^\w\s!?]/g,'');
}