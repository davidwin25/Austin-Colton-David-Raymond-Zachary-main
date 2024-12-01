
var data

// wait for dom to load, then initialize height, width, svg
document.addEventListener('DOMContentLoaded', async () => {
    
    const {playerData, countryData, gameData, teamData} = await wrangle()
    data = {playerData, countryData, gameData, teamData}
    console.log(playerData, countryData, gameData, teamData)


    // grabbing the select element from the html
    const barYearSelect = document.querySelector('#bar-year-select')

    // adding event listener
    barYearSelect.addEventListener('change', function() {
        barChart(playerData)
    })

    barChart(playerData) // draw bar chart
    lineGraph()
    pieChart()
    worldHeatMap()
})


// data wrangling
const wrangle = async () => Promise.all([
        d3.csv('./js/data/Top 100 Players 1998-2020.csv'),
        d3.csv('./js/data/Top Countries 1998-2020.csv'),
        d3.csv('./js/data/Top Games 1998-2020.csv'),
        d3.csv('./js/data/Top Teams 1998-2020.csv')
    ]).then(([playerData, countryData, gameData, teamData]) => {
        playerData.forEach((entry) => {
            entry['Year'] = YearstringToDate(entry['Year'])
            entry['Total Prize Money (Year)'] = USDstringToNumber(entry['Total Prize Money (Year)'])
            entry['Total Prize Money (Overall)'] = USDstringToNumber(entry['Total Prize Money (Overall)'])
            entry['% of Total'] = Number(entry['% of Total'].split('%')[0])
        })

        countryData.forEach((entry) => {
            entry['Year'] = YearstringToDate(entry['Year'])
            entry['Total Prize Money (Year)'] = USDstringToNumber(entry['Total Prize Money (Year)']);
            entry['Number of Players'] = Number(entry['Number of Players'])
        })

        gameData.forEach((entry) => {
            entry['Year'] = YearstringToDate(entry['Year'])
            entry['Total Prize Money (Year)'] = USDstringToNumber(entry['Total Prize Money (Year)'])
            entry['Number of Players'] = Number(entry['Number of Players'])
            entry['Number of Tournaments'] = Number(entry['Number of Tournaments'])
        })

        teamData.forEach((entry) => {
            entry['Year'] = YearstringToDate(entry['Year'])
            entry['Total Prize Money (Year)'] = USDstringToNumber(entry['Total Prize Money (Year)'])
            entry['Number of Tournaments'] = Number(entry['Number of Tournaments'])
        })

        // getting rid of the column headers so it doesn't hinder iteration in the future
        delete playerData['columns'], delete countryData['columns'], delete gameData['columns'], delete teamData['columns']
    
        return {playerData, countryData, gameData, teamData}
    })

function lineGraph() {
    const margin = {
        top: 20,
        left: 120,
        right: 20,
        bottom: 40
    }
    const height = 580 - margin.top - margin.bottom;
    const width = 700 - margin.left - margin.right;

    var svg = d3.select('#line-chart-container')
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    console.log(data.countryData)

    sumstat = d3.group(data.countryData, d => d['Country']);
    averagestat = d3.group(data.countryData, d => d['Year'])

    console.log(sumstat)
    console.log(averagestat)

    averages = []

    const xLineSc = d3.scaleTime()
                        .domain([new Date('1/1/1998'), new Date('1/1/2020')])
                        .range([ 0, width ]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xLineSc).ticks(5));

    const yLineSc = d3.scaleLinear()
        .domain([0, d3.max(data.countryData, function(d) { return +d['Total Prize Money (Year)']; })])
        .range([ height, 0 ]);
    svg.append("g")
        .call(d3.axisLeft(yLineSc));

    const colorLineSc = d3.scaleOrdinal()
        .domain(d3.extent(data.countryData, d => d['Country']))
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

    const singleLine = d3.line()
        .x(d => xLineSc(d['Year']))
        .y(d => yLineSc(d['Total Prize Money (Year)']))  
        .curve(d3.curveMonotoneX);

    labels = ['United States', 'China', 'Japan', 'Germany', 'India'] // Top 5 Countries Based on GDP

    labels.forEach(c => {
        svg.append('path')
            .datum(sumstat.get(c))
            .style('fill','none')
            .style('stroke',colorLineSc(c))
            .style('stroke-width','3')
            .attr('d', singleLine);
    })

    averagestat.forEach(e => {
        var key
        var sum = 0
        var ct = 0
        e.forEach(d => {
            if(labels.includes(d['Country'])){
                key = d['Year']
                sum = sum + d['Total Prize Money (Year)']
                ct++;
            }
        })
        var avg = sum/ct;
        averages.push({Year: key, Average: avg})
    })

    console.log(averages)

    // svg.selectAll('circles')
    //         .data(averages)
    //         .enter()
    //         .append('circle')
    //         .attr('cx', function(d) {console.log(xLineSc(d.Year)); return xLineSc(d.Year)})
    //         .attr('cy', function(d) {return yLineSc(d.Average)})
    //         .attr('r', 4)
    //         .style('fill', 'none')

    const lineAvg = d3.line()
                        .x(d => xLineSc(d.Year))
                        .y(d => yLineSc(d.Average))

    svg.append('path')
            .datum(averages)
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', '3')
            .attr('d', lineAvg)
    
    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", width/2)
        .attr("y", height + 35)
        .text("Year");

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("y", -75)
        .attr('x', -200)
        .attr("transform", "rotate(-90)")
        .text('Earnings per Year');

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", width - 250)
        .attr("y", -5)
        .text("Earnings Over Time By Country");

    // Legend
    svg.append("text").attr("x", 60).attr("y", 30).text("Legend").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append('circle').attr("cx",50).attr("cy",50).attr("r", 6).style("fill", colorLineSc("United States"))
    svg.append("text").attr("x", 60).attr("y", 50).text(" - United States").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append('circle').attr("cx",50).attr("cy",70).attr("r", 6).style("fill", colorLineSc("China"))
    svg.append("text").attr("x", 60).attr("y", 70).text(" - China").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append('circle').attr("cx",50).attr("cy",90).attr("r", 6).style("fill", colorLineSc("Japan"))
    svg.append("text").attr("x", 60).attr("y", 90).text(" - Japan").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append('circle').attr("cx",50).attr("cy",110).attr("r", 6).style("fill", colorLineSc("Germany"))
    svg.append("text").attr("x", 60).attr("y", 110).text(" - Germany").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append('circle').attr("cx",50).attr("cy",130).attr("r", 6).style("fill", colorLineSc("India"))
    svg.append("text").attr("x", 60).attr("y", 130).text(" - India").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append('circle').attr("cx",50).attr("cy",150).attr("r", 6).style("fill", "black")
    svg.append("text").attr("x", 60).attr("y", 150).text(" - Average").style("font-size", "15px").attr("alignment-baseline","middle")

}

const USDstringToNumber = (data) => Number(data.split('$')[1].split(',').join(''))
const YearstringToDate = (data) => new Date(`1/1/${data}`);

function barChart(playerData) {
    // margin, height, weight
    const margin = {top: 20, left: 80, right: 20, bottom: 50}
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    // testing
    const select = document.querySelector('#bar-year-select')

    const domain_map = {
        '1998-2005': [1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005],
        '1998-2010': [1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010],
        '1998-2015': [1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015],
        "1998-2020": [1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020]
    }

    // filter the data based on the year
    const filteredData = playerData.filter((entry) => domain_map[select.value].includes(new Date(entry['Year']).getFullYear()))

    // grouped on year
    const groupedData = d3.group(filteredData, d => new Date(d['Year']).getFullYear());

    // meant for the stats of each group
    const groupedStats = []

    // getting the year and mean for the grouped stats list
    groupedData.forEach((group, key) => {
        const values = group.map((entry) => entry['Total Prize Money (Year)'])
        const mean = d3.mean(values);
        groupedStats.push({
            Year: key,
            mean
        })
    })

    console.log(groupedStats)

    // svg element for this graph
    const svg = d3.select('#bar-chart-container')
        .selectAll('svg')
        .data([null])
        .join('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    const chartGroup = svg.selectAll('g.chart-group')
        .data([null])
        .join('g')
            .attr('class', 'chart-group')
            .attr('transform', `translate(${margin.left},${margin.top})`);
            

    // scales
    const xScale = d3.scaleBand()
        .domain(groupedStats.map((d) => d.Year).sort((a,b) => a - b))
        .range([0, width])
        .padding(0.2)

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(groupedStats, d => d['mean'])])
        .range([height, 0])


    // axes
    chartGroup.selectAll('.x-axis').data([null])
        .join('g')
            .transition().delay(500)
            .call(d3.axisBottom(xScale))
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height})`)
            .selectAll("text")
                .style("text-anchor", "center");

    chartGroup.selectAll('.y-axis').data([null])
        .join('g')
            .transition().transition(500)
            .call(d3.axisLeft(yScale))
            .attr('class', 'y-axis');

    // labels
    chartGroup.selectAll('.x-axis-label').data([null]).join('text')
        .attr('class', '.x-axis-label')
        .attr('x', width / 2 - margin.right)
        .attr('y', height + 50)
        .style('text-anchor', 'center')
        .text('Year')

    chartGroup.selectAll('.y-axis-label').data([null]).join('text')
        .attr('class', '.y-axis-label')
        .attr('x', -height / 2 - margin.bottom - margin.top)
        .attr('y', -60)
        .style('text-anchor', 'center')
        .attr('transform', 'rotate(-90)')
        .text('Average Prize Money (Year)')

    // bars
    const bars = chartGroup.selectAll('.bars')
        .data(groupedStats, d => d.Year);

    bars.enter()
        .append('rect')
        .attr('class', 'bars')
            .attr('x', d => xScale(d.Year))
            .attr('y', d => height)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', '#4daf4a')
            .transition()
            .delay(1000)
            .duration(500)
            .attr('y', d => yScale(d.mean))
            .attr('height', d => height - yScale(d.mean))

    bars.transition()
        .delay(500).duration(500)
            .attr('x', d => xScale(d.Year))
            .attr('y', d => yScale(d.mean))
            .attr('width', xScale.bandwidth)
            .attr('height', d => height - yScale(d.mean))
            .attr('fill', '#4daf4a');

    bars.exit()
        .transition()
        .duration(500)
            .attr('y', height)
            .attr('height', 0)
            .remove();
        
}


//PIE CHART___________________________******************************
function pieChart() {
    const pieWidth = 400;
    const pieHeight = 400;
    const radius = Math.min(pieWidth, pieHeight) / 2;

    const piesvg = d3
        .select(".pie-chart")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

    // Create layers for the pie chart and labels
    const pieLayer = piesvg.append("g").attr("class", "pie-layer");
    const labelLayer = piesvg.append("g").attr("class", "label-layer");

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie().value((d) => d['Number of Players']);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.5)")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const dataByYear = d3.group(data.countryData, (d) => new Date(d['Year']).getFullYear());
    const years = Array.from(dataByYear.keys());
    const defs = piesvg.append("defs");


    function sanitizeCountryName(country) {
        return country.replace(/\s+/g, '_'); 
    }

    // Function to update chart
    function updateChart(year) {
        const yearData = dataByYear.get(year); 
        const totalPlayers = d3.sum(yearData, (d) => +d['Number of Players']); 

        const paths = pieLayer.selectAll("path").data(pie(yearData));

        paths
            .transition()
            .duration(750)
            .attr("d", arc)
            .attr("fill", (d) => `url(#flag-pattern-${sanitizeCountryName(d.data['Country'])})`);

        paths
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", (d) => `url(#flag-pattern-${sanitizeCountryName(d.data["Country"])})`)
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(
                        `<strong>${d.data['Country']}</strong><br>Players: ${
                            d.data['Number of Players']
                        }<br>${((d.data['Number of Players'] / totalPlayers) * 100).toFixed(2)}%`
                    )
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`).style(
                    "top",
                    `${event.pageY - 20}px`
                );
            })
            .on("mouseout", () => tooltip.style("opacity", 0));


        const flagPatterns = defs.selectAll("pattern").data(yearData);

        // Update existing patterns
        flagPatterns
            .transition()
            .duration(750)
            .attr("id", (d) => `flag-pattern-${sanitizeCountryName(d['Country'])}`)
            .select("image")
            .attr("xlink:href", (d) => {
                if (d['Country'].includes("Korea")){
                    return `http://purecatamphetamine.github.io/country-flag-icons/3x2/KR.svg`;
                }else if (d['Country'].includes("Taiwan")){
                    return `http://purecatamphetamine.github.io/country-flag-icons/3x2/CN.svg`;
                }else{
                    const countryCode = countryCodeMapping[d['Country']] || 'ZZ'; 
                    return `http://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`; 
                }
               
            });

        // Enter new patterns for flags
        flagPatterns
            .enter()
            .append("pattern")
            .attr("id", (d) => `flag-pattern-${sanitizeCountryName(d['Country'])}`)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 30)
            .attr("height", 20)
            .append("image")
            .attr("xlink:href", (d) => {
                if (d['Country'].includes("Korea")){
                    return `http://purecatamphetamine.github.io/country-flag-icons/3x2/KR.svg`;
                }else if (d['Country'].includes("Taiwan")){
                    return `http://purecatamphetamine.github.io/country-flag-icons/3x2/CN.svg`;
                }else{
                    const countryCode = countryCodeMapping[d['Country']] || 'ZZ'; 
                    return `http://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`;
                }
            })
            .attr("width", 30)
            .attr("height", 20)
            .on("load", function() {

                paths.transition().duration(750).attr("fill", (d) => `url(#flag-pattern-${sanitizeCountryName(d.data['Country'])})`);
            });


        flagPatterns.exit().remove();
    }


    const buttons = d3
        .select(".year-buttons")
        .selectAll("button")
        .data(years)
        .enter()
        .append("button")
        .text((d) => d)
        .on("click", function (event, year) {

            updateChart(year);


            d3.selectAll("button").classed("active", false);
            d3.select(this).classed("active", true);
        });


    updateChart(years[0]);
    buttons.filter((d) => d === years[0]).classed("active", true);
}


function sanitizeCountryName(country) {
    return country.replace(/\s+/g, '_'); 
}


const countryCodeMapping = {
    "United States": "US",
    "India": "IN",
    "China": "CN",
    "Brazil": "BR",
    "Germany": "DE",
    "United Kingdom": "GB",
    "France": "FR",
    "Italy": "IT",
    "Australia": "AU",
    "Canada": "CA",
    "Russian Federation": "RU",
    "Japan": "JP",
    " Korea,Republic of": "KR",
    "Mexico": "MX",
    "Spain": "ES",
    "Indonesia": "ID",
    "Turkey": "TR",
    "Netherlands": "NL",
    "Saudi Arabia": "SA",
    "South Africa": "ZA",
    "Argentina": "AR",
    "Sweden": "SE",
    "Egypt": "EG",
    "Poland": "PL",
    "Thailand": "TH",
    "Belgium": "BE",
    "Pakistan": "PK",
    "Viet Nam": "VN",
    "Nigeria": "NG",
    "Israel": "IL",
    "Greece": "GR",
    "Malaysia": "MY",
    "Chile": "CL",
    "Romania": "RO",
    "Peru": "PE",
    "Nigeria": "NG",
    "Singapore": "SG",
    "Philippines": "PH",
    "Colombia": "CO",
    "Ukraine": "UA",
    "Ireland": "IE",
    "Chile": "CL",
    "New Zealand": "NZ",
    "Switzerland": "CH",
    "Czech Republic": "CZ",
    "Portugal": "PT",
    "Vietnam": "VN",
    "Norway": "NO",
    "Finland": "FI",
    "Denmark": "DK",
    "Hungary": "HU",
    "South Africa": "ZA",
    "Ukraine": "UA",
    "Slovakia": "SK",
    "Morocco": "MA",
    "Kenya": "KE",
    "Bangladesh": "BD",
    "Egypt": "EG",
    "Pakistan": "PK",
    "Sri Lanka": "LK",
    "Belarus": "BY",
    "Bulgaria": "BG",
    "Croatia": "HR",
    "Estonia": "EE",
    "Latvia": "LV",
    "Lithuania": "LT",
    "Slovenia": "SI",
    "Luxembourg": "LU",
    "Algeria": "DZ",
    "Tunisia": "TN",
    "Jordan": "JO",
    "Kazakhstan": "KZ",
    "Uzbekistan": "UZ",
    "Qatar": "QA",
    "Bahrain": "BH",
    "Oman": "OM",
    "Kuwait": "KW",
    "Lebanon": "LB",
    "Armenia": "AM",
    "Georgia": "GE",
    "Moldova": "MD",
    "Azerbaijan": "AZ",
    "Cyprus": "CY",
    "Malta": "MT",
    "Iceland": "IS",
    "Bhutan": "BT",
    "Nepal": "NP",
    "Laos": "LA",
    "Cambodia": "KH",
    "Myanmar": "MM",
    "Mongolia": "MN",
    "Papua New Guinea": "PG",
    "Tanzania": "TZ",
    "Zambia": "ZM",
    "Uganda": "UG",
    "Mozambique": "MZ",
    "Angola": "AO",
    "Botswana": "BW",
    "Namibia": "NA",
    "Malawi": "MW",
    "Zimbabwe": "ZW"
  };


//----------------- Heatmap -----------------//
function worldHeatMap(){
    const world_margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const world_width = 960 - world_margin.left - world_margin.right;
    const world_height = 500 - world_margin.top - world_margin.bottom;

    // Create container div for the map
    const mapContainer = d3.select('.flex-col')
        .append('div')
        .attr('class', 'map-container')
        .append('h3')
        .text('Global eSports Earnings Distribution')
        .append('div')
        .attr('class', 'map-controls');

    const controls = mapContainer.append('div')
     .attr('class', 'controls-container');

    const sliderContainer = controls.append('div')
        .attr('class', 'slider-container');

    const svg = mapContainer.append('svg')
        .attr('width', world_width + world_margin.left + world_margin.right)
        .attr('height', world_height + world_margin.top + world_margin.bottom)
        .append('g')
        .attr('transform', `translate(${world_margin.left}, ${world_margin.top})`);
    const map_group = svg.append('g');

    const projection = d3.geoNaturalEarth1()
        .scale(world_width / 2 / Math.PI)
        .translate([world_width / 2, world_height / 2]);

   
    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateOrRd)
    .domain([0, 1]);
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'map-tooltip')
        .style('opacity', 0);
    //load the map
    Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        process_Country_Data()
    ]).then(([world, countryDataByYear]) => {
        const countries = topojson.feature(world, world.objects.countries);

        const years = Array.from(countryDataByYear.keys()).sort();
        let currentYear = years[0];

        const year_slider = sliderContainer.append('input')
            .attr('type', 'range')
            .attr('min', years[0])
            .attr('max', years[years.length - 1])
            .attr('value', currentYear)
            .attr('step', 1)
            .attr('class', 'year-slider');

        const year_display = sliderContainer.append('span')
            .attr('class', 'year-display')
            .text(currentYear);
         // Add play/pause button
         const playButton = controls.append('button')
         .attr('class', 'play-button')
         .text('START');
         
        let play = false;
        let interval;
        map_group.selectAll('path')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => get_Country_Color(d, currentYear, countryDataByYear))
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .on('mouseover', function(event, d) {
                const countryData = get_Country_Data(d, currentYear, countryDataByYear);
                show_tooltip(event, d, countryData);
            })
            .on('mouseout', hide_tooltip);
            
        //function to update the map based on the selected year
        function updateMap(year){
            map_group.selectAll('.country')
            .transition()
            .duration(100)
            .attr('fill', d => get_Country_Color(d, year, countryDataByYear));
            

            year_display.text(year);
        }

        // Autoplay Button
        playButton.on('click', function() {
            if (play) {
                clearInterval(interval);
                playButton.text('START');
            } else {
                interval = setInterval(() => {
                    currentYear = currentYear >= years[years.length - 1] ? years[0] : currentYear + 1;
                    year_slider.property('value', currentYear);
                    updateMap(currentYear);
                }, 750);
                playButton.text('PAUSE');
            }
            play = !play;
        });

        //event listener for slider
        year_slider.on('input', function(){
            currentYear = +this.value;
            updateMap(currentYear);
        });
        //color legend
        const legend_width = 300;
        const legend_height = 20;
        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, legend_width]);
        const map_legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${world_width - legend_width - 20},${world_height})`);
        const legend_axis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => d3.format('.0%')(d));
        map_legend.append('g')
            .attr('transform', `translate(0,${legend_height})`)
            .call(legend_axis);
        const legend_gradient = map_legend.append('defs')
            .append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%');
        legend_gradient.selectAll('stop')
            .data(colorScale.ticks().map((t, i, n) => ({ 
                offset: `${100 * i / n.length}%`,
                color: colorScale(t) 
            })))
            .enter()
            .append('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        map_legend.append('rect')
            .attr('width', legend_width)
            .attr('height', legend_height)
            .style('fill', 'url(#legend-gradient)');
    });

    //---helper functions to process the data---//
    function process_Country_Data(){
        const country_year_data = new Map();

        data.countryData.forEach(d => {
            const year = new Date(d.Year).getFullYear();
            if(!country_year_data.has(year)){
                country_year_data.set(year, new Map());
            }
            country_year_data.get(year).set(d.Country, d);
        });
        return country_year_data;
    }
    function get_Country_Data(feature, year, countryDataByYear){
        const country_name = feature.properties.name;
        const year_data = countryDataByYear.get(year);
        return year_data ? year_data.get(country_name) : null;
    }


    function get_Country_Color(feature, year, countryDataByYear) {
        const countryData = get_Country_Data(feature, year, countryDataByYear);
        if (!countryData) return '#ccc';
        
        const maxEarnings = d3.max(data.countryData, d => d['Total Prize Money (Year)']);
        return colorScale(countryData['Total Prize Money (Year)'] / maxEarnings);
    }

    //tooltip functions 
    function show_tooltip(event, feature, countryData) {
        if (!countryData) return;
        
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
            
        tooltip.html(`
            <strong>${feature.properties.name}</strong><br/>
            Earnings: $${d3.format(',')(countryData['Total Prize Money (Year)'])}<br/>
            Players: ${countryData['Number of Players']}
        `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    function hide_tooltip() {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
    }

// Scatter Plot with Dropdown Filtering and Autoplay for Top Teams Earnings
d3.csv("js/data/Top Teams 1998-2020.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.Year = +d.Year;
        d["Total Prize Money (Year)"] = +d["Total Prize Money (Year)"].replace(/[$,]/g, "");
        d["Number of Tournaments"] = +d["Number of Tournaments"];
    });

    const margin = { top: 40, right: 40, bottom: 70, left: 70 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "#f9f9f9")
        .style("border", "1px solid #ccc")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.Year) - 1, d3.max(data, d => d.Year) + 1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Total Prize Money (Year)"])])
        .range([height, 0]);

    const size = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d["Number of Tournaments"])])
        .range([3, 8]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add axes labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Year");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Total Prize Money (Year)");

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.2)")
        .style("visibility", "hidden")
        .style("font-size", "12px");

    // Function to update scatter plot
    function updatePlot(filteredData) {
        // Bind data
        const circles = svg.selectAll("circle").data(filteredData, d => d.Team + d.Year);

        // Exit old elements
        circles.exit()
            .transition().duration(500)
            .attr("r", 0)
            .remove();

        // Update existing elements
        circles.transition().duration(500)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d["Total Prize Money (Year)"]))
            .attr("r", d => size(d["Number of Tournaments"]))
            .attr("fill", d => color(d.Team))
            .attr("opacity", 0.8);

        // Enter new elements
        circles.enter()
            .append("circle")
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d["Total Prize Money (Year)"]))
            .attr("r", 0)
            .attr("fill", d => color(d.Team))
            .attr("stroke", "#333")
            .attr("opacity", 0)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`<strong>${d.Team}</strong><br>Year: ${d.Year}<br>Prize: $${d3.format(",")(d["Total Prize Money (Year)"])}`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"))
            .transition().duration(500)
            .attr("r", d => size(d["Number of Tournaments"]))
            .attr("opacity", 0.8);
    }
    // Populate dropdown menu
    const teamNames = Array.from(new Set(data.map(d => d.Team))).sort();
    const dropdown = d3.select("#team-dropdown");
    dropdown.append("option").text("All Teams").attr("value", "all");
    teamNames.forEach(team => {
        dropdown.append("option").text(team).attr("value", team);
    });

    // Filter by team
    dropdown.on("change", function() {
        const selectedTeam = this.value;
        if (selectedTeam === "all") {
            updatePlot(data);
        } else {
            const filteredData = data.filter(d => d.Team === selectedTeam);
            updatePlot(filteredData);
        }
    });

    // Autoplay and stop functionality
    let autoplayInterval;
    const autoplayButton = d3.select("#autoplay-button");
    autoplayButton.on("click", function() {
        if (autoplayButton.text() === "Autoplay") {
            let year = 1998;
            autoplayInterval = setInterval(() => {
                const filteredData = data.filter(d => d.Year === year);
                updatePlot(filteredData);
                year++;
                if (year > 2020) {
                    clearInterval(autoplayInterval);
                    autoplayButton.text("Autoplay");
                    updatePlot(data); // Reset to all data at the end
                }
            }, 1000); // 1-second interval per year
            autoplayButton.text("Stop");
        } else {
            clearInterval(autoplayInterval);
            updatePlot(data); // Reset to all data
            autoplayButton.text("Autoplay");
        }
    });

    // Initial plot
    updatePlot(data);
});
