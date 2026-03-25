function buildTable(data) {
  // pega aquí
}

function buildPagination(total) {
  // pega aquí
}

function goPage(p){
  page=p;
  buildTable(filtered);
}

function sortBy(col){
  if(sortCol===col) sortAsc=!sortAsc;
  else {sortCol=col;sortAsc=false;}
  buildTable(filtered);
}