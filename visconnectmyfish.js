// Immediately Invoked Function Expression to limit access to our 
// variables and prevent nonsense
((() => {


let hb = hexboard()('.vis-holder', null)

function hexboard() {

  // Based on Mike Bostock's margin convention
  // https://bl.ocks.org/mbostock/3019563
  let margin = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    width = 800 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom,
    tilesInOddRows = 14,// odd rows 1, 3, 5... Even rows 0, 2, 4 are +1 but half of each end is off map
    fishTilesInOddRows = 8,
    tilesInEvenRows = tilesInOddRows + 1,
    fishTileBuffer = (tilesInOddRows - fishTilesInOddRows) / 2,
    tilesInTwoRows = tilesInOddRows + tilesInEvenRows,
    hexradius = width / Math.sqrt(3) / tilesInOddRows,
    hexHeight = hexradius * 2,
    hexWidth = Math.sqrt(3) * hexradius,
    penguinScale = .7, 
    penguinHeight = penguinScale * hexHeight,
    penguinWidth = 290 * penguinHeight / 311;

  // Create the chart by adding an svg to the div with the id 
  // specified by the selector using the given data
  function chart(selector, data) {
    let svg = d3.select(selector)
      .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom].join(' '))
        .classed('svg-content', true);

    svg = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width - .5)
        .attr('height', height - .5)
        .attr('stroke-width', .5)
        .attr('stroke', '#bbb')
        .attr('fill', 'none')
    
    let hexbin = d3.hexbin()
      .radius(hexradius)
      .size([width, height]);
      
    //// FOR DEBUGGING
    // let hexMesh = hexbin.mesh();
    // svg.append('path')
        // .attr('d', hexMesh)
        // .attr('stroke-width', .5)
        // .attr('stroke', '#bbb')
        // .attr('fill', 'none')
        //// .attr('transform', 'translate(0, ' + hexheight + ')');
      
    let hexCenters = hexbin.centers();
    hexCenters = hexCenters.filter(d => d[0] <= width);// && d[1] <= height);// Don't use hex centers outside the viewbox, but we need the bottom row filled so we don't filter height
    
    //// FOR DEBUGGING
    // svg.selectAll('.hexcenter')
      // .data(hexCenters)
      // .join('circle')
        // .attr('cx', d => d[0])
        // .attr('cy', d => d[1])
        // .attr('r', 1);
    
    let tileDistribution = [
      {count: 30, img: 'img/one-fish.png'},
      {count: 20, img: 'img/two-fish.png'},
      {count: 10, img: 'img/three-fish.png'},
    ]
    let waterImage = 'img/water.png';
    let plainIceImage = ['img/no-fish.png', 'img/no-fish2.png']
    
    let penguinImages = 
      [
        {img: 'img/red-penguin.png'},
        {img: 'img/green-penguin.png'},
        {img: 'img/blue-penguin.png'},
        {img: 'img/yellow-penguin.png'},
      ],
      penguinCount = 4,
      penguins = [];
    
    function alternatePenguinImages(idxA, idxB){
      penguins.push({img: penguinImages[idxA].img})
      penguins.push({img: penguinImages[idxB].img})  
    }
    
    for(let i = 0; i < penguinImages.length; i+=2){
      for(let j = 0; j < penguinCount; j++){
        alternatePenguinImages(i, i + 1);
      }
    }
    
    chart.reset = function () {
      console.log('reset')
      
      let tiles = [];
      tileDistribution.forEach(function(d) {
        let i;
        for (i = 0; i < d.count; i++){
          tiles.push({img: d.img})
        }
      })  
      shuffle(tiles);

      let
        placedTiles = [],
        penguinIndex = 0;
      hexCenters.forEach(function(d, i){
        
        let ctrX = d[0],
            ctrY = d[1];
        if(ctrX > width) return;
        
        let evenRows = Math.floor(i / tilesInTwoRows) * 2,
            toSubtract = i - evenRows / 2 * tilesInTwoRows,
            oddRowOffset = Math.floor(toSubtract/(tilesInOddRows + 1)),
            row = evenRows + oddRowOffset,
            rowIsEven = row % 2 == 0,
            col = toSubtract % (tilesInOddRows + 1)
        
        let tileMinX = ctrX - hexWidth / 2,
            tileMinY = ctrY - hexHeight / 2,
            tileMaxX = ctrX + hexWidth / 2,
            tileMaxY = ctrY + hexHeight / 2;
        
        placedTiles.push({
          type: 'water',
          x: tileMinX,
          y: tileMinY,
          idx: i,
          r: row,
          c: col,
          img: waterImage,
        });
        
        if(
          tileMinX >= 0     &&
          tileMinY >= 0     &&
          tileMaxX <= width && 
          tileMaxY <= height
          ){// we are not off map
           
          if(
            tiles.length > 0 &&
            col >= (rowIsEven ? fishTileBuffer + 1 : fishTileBuffer) &&
            col < tilesInOddRows - fishTileBuffer
          ){
            placedTiles.push({
              type: 'fish',
              x: tileMinX,
              y: tileMinY,
              idx: i,
              r: row,
              c: col,
              img: tiles.shift().img
            });
          } 
       
          if((
            (rowIsEven ? col - 1 : col) == 0 || col == tilesInOddRows - 1) &&
            penguinIndex < penguins.length
            ){
            let penguin = penguins[penguinIndex++];
            penguin.x = ctrX - penguinWidth / 2;
            penguin.y = ctrY - 3 * penguinHeight / 4; // to move the penguin higher than center
          
            placedTiles.push({
              type: 'plain',
              x: tileMinX,
              y: tileMinY,
              idx: i,
              r: row,
              c: col,
              img: plainIceImage[Math.floor(Math.random() * plainIceImage.length)]
            });
          }       
        };
      });
      
      svg.selectAll('.tile')
        .data(placedTiles)
        .join('svg:image')
          .attr('xlink:href', d => d.img)
          .attr('class', d => 'tile' + (dragallowed(d) ? ' draggable' : ''))
          .attr('height', hexHeight)
          .attr('x', d => d.x)
          .attr('y', d => d.y)
          .attr('id', d => 'i:' + d.idx + ', row:' + d.r + ', col:' + d.c)
          .call(tiledrag());         
      
      function tiledrag(){
        function dragstarted(d) {
          if(!dragallowed(d)){
            return;
          }
          d3.select(this)
              .raise()
              .classed('picked', true);
        }

        function dragged(d) {
          if(!dragallowed(d)){
            return;
          }
          d3.select(this)
              .attr('x', d.x = Math.min(width - hexWidth, Math.max(0, d3.event.x)))
              .attr('y', d.y = Math.min(height - hexHeight, Math.max(0, d3.event.y)));
        }

        function dragended(d) {
          if(!dragallowed(d)){
            return;
          }
          d3.select(this)
              .attr('stroke', null)
              .classed('picked', false);
          d3.selectAll('.penguin')
              .raise()
        }
        
        return vc.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
      }
      
      function dragallowed(d){
        return d.type != 'water' && d.type != 'plain';
      }
      
      svg.selectAll('.penguin')
        .data(penguins)
        .join('svg:image')
          .attr('xlink:href', d => d.img)
          .attr('class', 'penguin')
          .attr('height', penguinHeight)
          .attr('x', d => d.x)
          .attr('y', d => d.y)
          .raise()
          .call(tiledrag());
      
      return chart;
    };
    
    
    d3.select('#resetButton')
        .on('click', chart.reset);

    chart.reset();
    return chart;
  }

  // Randomly shuffle an array
  // https://stackoverflow.com/a/2450976/1293256
  function shuffle(array) {

    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(vc.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  return chart;
}

})());