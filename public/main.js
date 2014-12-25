var stats = {page: 0, results: 0, maxpages: 0, maxresults: 0, status: '', url: ''};
var filter = {minrating: 0, mindiscount: 0, minreviews: 0, pages: 0, minprice: '', maxprice: '', bestseller: false};

var products = [];
var xhr;


var statDownloading = 'Downloading&hellip;';
var statFinished    = 'Finished.';
var statCancelled   = 'Cancelled.';


var csvfields = {
  search:     'Search Phrase',
  category:   'Category',
  asin:       'Product ID', 
  title:      'Product',
  brand:      'Brand or Artist',
  release:    'Release',
  format:     'Format',
  list_price: 'List Price', 
  sale_price: 'Sale Price',
  discount:   'Discount',
  percent:    '%',
  commission: 'Comm.',
  rank:       'Bestseller',
  rating:     'Rating',
  reviews:    'Reviews',
  link:       'Link'
}

var table;

// setup when the page is loaded
$(function(){

  function stripnumber(s){ return s.replace(/[^0-9.]/g,'')/1; }

  function lp(s,t,v){
    if(t === 'set') { s.list_price = v; s.list_price_num = stripnumber(s.list_price); return; }
    if(t === undefined || t === 'display') return s.list_price;
    return s.list_price_num;
  }

  function sp(s,t,v){
    if(t === 'set') { s.sale_price = v; s.sale_price_num = stripnumber(s.sale_price); return; }
    if(t === undefined || t === 'display') return s.sale_price;
    return s.sale_price_num;
  }

  function dc(s,t,v){
    if(t === 'set') { s.discount = v; s.discount_num = stripnumber(s.discount); return; }
    if(t === undefined || t === 'display') return s.discount;
    return s.discount_num;
  }

  function pc(s,t,v){
    if(t === 'set') { s.percent = v; s.percent_num = stripnumber(s.percent); return; }
    if(t === undefined || t === 'display') return s.percent;
    return s.percent_num;
  }

  function cm(s,t,v){
    if(t === 'set') { s.commission = v; s.commission_num = stripnumber(s.commission); return; }
    if(t === undefined || t === 'display') return s.commission;
    return s.commission_num;
  }

  function asin(s,t,v){
    if(t === 'set') { s.asin = v; s.asin_link = '<a href="'+s.link+'" target="amazon">'+s.asin+'<img class="hbox" src="'+s.image+'"></a>'; return; }
    if(t === undefined) return s.asin;
    return s.asin_link;
  }

  table = $('#results').dataTable( {
    aoColumns: [
      { mData: 'category',sTitle: 'Category',                                   sClass: 'category',   sWidth: '5em' },
      { mData:  asin,     sTitle: 'Prod&nbsp;ID',    bSortable:  false,         sClass: 'asin',       sWidth: '4em' },
      { mData: 'title',   sTitle: 'Product',                                    sClass: 'title'                     },
      { mData:  lp,       sTitle: 'List&nbsp;Price', asSorting: ['desc','asc'], sClass: 'price',      sWidth: '5em' },
      { mData:  sp,       sTitle: 'Sale&nbsp;Price', asSorting: ['desc','asc'], sClass: 'price',      sWidth: '5em' },
      { mData:  dc,       sTitle: 'Saving',          asSorting: ['desc','asc'], sClass: 'price',      sWidth: '5em' },
      { mData:  pc,       sTitle: '% Saving',        asSorting: ['desc','asc'], sClass: 'percent',    sWidth: '5em' },
      { mData:  cm,       sTitle: 'Comm.',           asSorting: ['desc','asc'], sClass: 'price',      sWidth: '5em' },
      { mData: 'rank',    sTitle: 'Best.',           asSorting: ['desc','asc'], sClass: 'bestseller', sWidth: '2em' },
      { mData: 'rating',  sTitle: 'Rating',          asSorting: ['desc','asc'], sClass: 'rating',     sWidth: '4em' },
      { mData: 'reviews', sTitle: 'Reviews',         asSorting: ['desc','asc'], sClass: 'reviews',    sWidth: '4em' }
    ],
    aaSorting: [[9,'desc'],[11,'desc'],[10,'desc']],
    iDisplayLength: 500,
    aLengthMenu: [25,50,75,100,250,500,1000,2500,5000,7500,10000],
    bStateSave: true,
    bAutoWidth: false,
    //bJQueryUI: true,
    sDom: 'Rlfprt', //'<"top"i l>t',
    //sSearch: "Search all columns:",
    sPaginationType: "full_numbers",
    bScrollY: true
  } );

  $.fn.dataTableExt.afnFiltering.push(
    function( oSettings, aData, iDataIndex ) {
      return aData[9] /1 >= filter.minrating  &&
             aData[10] /1 >= filter.minreviews &&
             aData[6]    >= filter.mindiscount &&
            (aData[8] == 'Yes' || !filter.bestseller) &&
            (!filter.maxprice || aData[4] <= filter.maxprice) && 
            (!filter.minprice || aData[4] >= filter.minprice);
    }
  );

  /* Add a select menu for each TH element in the table footer */
  $("#results thead th").each(function(i){
    if(i == 9) /* rating */ $(this).append('<select id="rating" name="rating">'+
      [0,'5.0',4.9,4.8,4.7,4.6,4.5,4.4,4.3,4.2,4.1,'4.0',3.9,3.8,3.5,'3.0'].map(function(i,e){
        return '<option value="'+i+'"'+(i == 0 ? ' selected' : '')+'>'+(i == 5 ? '5.0' : i > 0 ? i+'+' : 'All')+'</option>';}).join('')+'</select>');
    if(i == 10) /* reviews */ $(this).append('<select id="reviews" name="reviews">'+
      [0,1,2,5,10,25,50,75,100,150,200,250,300,400,500,750,1000,2500,5000,10000].map(function(i,e){
        return '<option value='+i+(i == 0 ? ' selected' : '')+'>'+(i > 0 ? i+'+' : 'All')+'</option>';}).join('')+'</select>');
    if(i == 8) /* bestseller */ $(this).append('<input id="bestseller" name="bestseller" type="checkbox">');
    if(i == 6) /* discount */ $(this).append('<select id="discount" name="discount">'+
      [0,10,25,50,75,80,85,90,95,96,97,98,99].map(function(i,e){
        return '<option value='+i+(i == 0 ? ' selected' : '')+'>'+(i > 0 ? i+'%' : 'All')+'</option>';}).join('')+'</select>');
    if(i == 4) /* price */ $(this).append('<select id="maxprice" name="maxprice">'+
      [0,10,20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000].map(function(i,e){
        return '<option value='+i+(i == 0 ? ' selected' : '')+'>'+(i == 0 ? 'All' : i == 1 ? '0-10' : i == 200000 ? '20000 and up' : i/10+'-'+i)+'</option>';}).join('')+'</select>');
  });

  function killclick(e){
    e.stopPropagation();
  }

  function filterchange(e) {
    filter.minrating   = $("#rating").val()  /1;
    filter.minreviews  = $("#reviews").val() /1;
    filter.mindiscount = $("#discount").val() /1;
    filter.bestseller  = $("#bestseller")[0].checked;

    filter.minprice    = 0;
    filter.maxprice    = $("#maxprice").val() /1;
    if(filter.maxprice == 0) filter.maxprice = null;
    if(filter.maxprice && filter.maxprice > 10) filter.minprice = filter.maxprice/10;
    if(filter.maxprice == 200000) filter.maxprice = null; // no upper limit there

    table.fnDraw();
  }

  $('#domain').change(categories);
  categories();

  $('#pages').change(pageschange);
  pageschange();

  $('th input').add('th select').click(killclick);
  $('th input').add('th select').mousedown(killclick);
  $('th input').add('th select').change(filterchange);
  filterchange();

  $('#csv').click(build_csv_link);

  $('#submit').click(submitform);
  $('#search').submit(submitform);
  $('#search input').add('#search select').keypress(function(e){if(e.which == 13){submitform();}});

  $("#cancel").click(cancel_search);
  $("#bye").click(bye);
  $("#logout").click(logout);

  display_status(); // calls itself in a loop
  sizing(); // this too
});


function bye(){
  if(window.confirm("Are you sure you want to quit AmaSpy?")) {
    cancel_search();
  } else {
    return false;
  }
}

function logout(){
  if(window.confirm("Are you sure you want to log out of AmaSpy?")) {
    cancel_search();
  } else {
    return false;
  }
}

function sizing(){
  try { var a = $("#refinements"); if(a.offset()) a.height(window.innerHeight - a.offset().top - a.offset().left + 4); } catch(e) {}
  setTimeout(sizing,200);
}


function set_url(url){
  stats.url = url;
  $("#url").val(url);
}


function build_url(){

  var kw = $('#keyword').val();

  if(kw.substring(0,7) == 'http://'){
    set_url(kw);
    return;
  }

  var cat = $("#category").val();
  var url = 'http://www.amazon.' + $("#domain").val() + '/s/ref=nb_sb_noss?ie=UTF8&url=' + escape(cat);

  var v;
  v = $("#off").val();     if(v != '') url += '&pct-off='        + v + '-';
  v = $("#low").val();     if(v != '') url += '&low-price='      + v;
  v = $("#high").val();    if(v != '') url += '&high-price='     + v;

  if(kw == '') kw = '*';
  url += '&field-keywords=' + escape(kw);

  set_url(url);
}


function newsearch(){
  cancel_search(); // first cancel a running search, if there is one

  stats.page = 1;
  stats.maxresults = 'n/a';
  table.fnClearTable();
  $("#sortBy").replaceWith('<div id="sortBy">&nbsp;</div>');
  $("#refinementswrapper").empty().append('<div id="refinements">&nbsp;</div>');
  $("#breadcrumbs").html('&nbsp;');

  // give time to display_stats to pick up on the previous cancelling
  setTimeout(function(){stats.status = statDownloading;},500);

  post();
}


function cancel_search(){
  if(stats.status == statDownloading) stats.status = statCancelled;
  if(xhr) xhr.abort();
}


function submitform(){
  build_url();
  newsearch();
  return false;
}


function pageschange(){
  filter.pages = $("#pages").val() /1;
}


var pcol = 0;
function progresscolor(){
  var c = 50 + Math.round(50*Math.cos(pcol++ / 1.5));
  return 'rgb('+[c,c,c].join()+')';
}


function display_status() {

  if(stats.status == statDownloading) {
    $('#message').html(stats.status).attr('href',stats.url).css('color',progresscolor());
    $('#cancel').removeClass('hidden');
  } else {
    $('#message').html(stats.status).attr('href',stats.url).css('color','black');
    $('#cancel').addClass('hidden');
  }

  if(stats.page > 0) {
    var pages = stats.page - 1; // stats.page is download*ing* -- we're displaying one less for the download*ed*

    $('#pagestats').removeClass('hiddenchildren');
    $('#downloadedpages').html(pages);
    $('#requestedpages').html(filter.pages < stats.maxpages ? filter.pages : '');
    $('#availablepages').html(stats.maxpages == 0 ? 'n/a' : stats.maxpages < pages ? pages : stats.maxpages);

    var fns = table.fnSettings();
    if(fns) {
      $('#resultstats').removeClass('hiddenchildren');

      var start = fns._iDisplayStart+1;
      var end   = fns._iDisplayEnd;
      var d = fns.fnRecordsDisplay();
      var t = fns.fnRecordsTotal();

      if(start > 1 || end < d) {
        $("#displayedresults").removeClass('hidden');
        $("#firstdisplayed").html(start);
        $("#lastdisplayed").html(end);
      } else {
        $("#displayedresults").addClass('hidden');
      }

      $("#filteredresults").html(d < t ? d : '');
      $("#downloadedresults").html(t);
      $("#totalresults").html(stats.maxresults);
    }
  }

  setTimeout(display_status,200);
}


var cats = {
  'com':'<option value="search-alias=aps" selected="selected">All Departments</option><option value="search-alias=instant-video">Amazon Instant Video</option><option value="search-alias=appliances">Appliances</option><option value="search-alias=mobile-apps">Apps for Android</option><option value="search-alias=arts-crafts">Arts, Crafts &amp; Sewing</option><option value="search-alias=automotive">Automotive</option><option value="search-alias=baby-products">Baby</option><option value="search-alias=beauty">Beauty</option><option value="search-alias=stripbooks">Books</option><option value="search-alias=mobile">Cell Phones &amp; Accessories</option><option value="search-alias=apparel">Clothing &amp; Accessories</option><option value="search-alias=collectibles">Collectibles</option><option value="search-alias=computers">Computers</option><option value="search-alias=financial">Credit Cards</option><option value="search-alias=electronics">Electronics</option><option value="search-alias=gift-cards">Gift Cards Store</option><option value="search-alias=grocery">Grocery &amp; Gourmet Food</option><option value="search-alias=hpc">Health &amp; Personal Care</option><option value="search-alias=garden">Home &amp; Kitchen</option><option value="search-alias=industrial">Industrial &amp; Scientific</option><option value="search-alias=jewelry">Jewelry</option><option value="search-alias=digital-text">Kindle Store</option><option value="search-alias=magazines">Magazine Subscriptions</option><option value="search-alias=movies-tv">Movies &amp; TV</option><option value="search-alias=digital-music">MP3 Music</option><option value="search-alias=popular">Music</option><option value="search-alias=mi">Musical Instruments</option><option value="search-alias=office-products">Office Products</option><option value="search-alias=lawngarden">Patio, Lawn &amp; Garden</option><option value="search-alias=pets">Pet Supplies</option><option value="search-alias=shoes">Shoes</option><option value="search-alias=software">Software</option><option value="search-alias=sporting">Sports &amp; Outdoors</option><option value="search-alias=tools">Tools &amp; Home Improvement</option><option value="search-alias=toys-and-games">Toys &amp; Games</option><option value="search-alias=videogames">Video Games</option><option value="search-alias=watches">Watches</option>',
  'ca':'<option value="search-alias=aps" selected="selected">All Departments</option><option value="search-alias=baby">Baby</option><option value="search-alias=stripbooks">Books</option><option value="search-alias=classical">Classical</option><option value="search-alias=electronics">Electronics</option><option value="search-alias=kitchen">Home &amp; Kitchen</option><option value="search-alias=digital-text">Kindle Store</option><option value="search-alias=dvd">Movies &amp; TV</option><option value="search-alias=popular">Music</option><option value="search-alias=software">Software</option><option value="search-alias=sporting">Sports &amp; Outdoors</option><option value="search-alias=tools">Tools &amp; Building Supplies</option><option value="search-alias=vhs">VHS</option><option value="search-alias=videogames">Video Games</option><option value="search-alias=watches">Watches</option>',
  'co.uk':'<option value="search-alias=aps" selected="selected">All Departments</option><option value="search-alias=baby">Baby</option><option value="search-alias=beauty">Beauty</option><option value="search-alias=stripbooks">Books</option><option value="search-alias=automotive">Car &amp; Motorbike</option><option value="search-alias=classical">Classical</option><option value="search-alias=clothing">Clothing</option><option value="search-alias=computers">Computers &amp; Accessories</option><option value="search-alias=diy">DIY &amp; Tools</option><option value="search-alias=electronics">Electronics &amp; Photo</option><option value="search-alias=dvd">Film &amp; TV</option><option value="search-alias=outdoor">Garden &amp; Outdoors</option><option value="search-alias=grocery">Grocery</option><option value="search-alias=drugstore">Health &amp; Beauty</option><option value="search-alias=jewelry">Jewellery</option><option value="search-alias=digital-text">Kindle Store</option><option value="search-alias=kitchen">Kitchen &amp; Home</option><option value="search-alias=appliances">Large Appliances</option><option value="search-alias=lighting">Lighting</option><option value="search-alias=digital-music">MP3 Music</option><option value="search-alias=popular">Music</option><option value="search-alias=mi">Musical Instruments &amp; DJ</option><option value="search-alias=videogames">PC &amp; Video Games</option><option value="search-alias=pets">Pet Supplies</option><option value="search-alias=shoes">Shoes &amp; Accessories</option><option value="search-alias=software">Software</option><option value="search-alias=sports">Sports &amp; Outdoors</option><option value="search-alias=office-products">Stationery &amp; Office Supplies</option><option value="search-alias=toys">Toys &amp; Games</option><option value="search-alias=vhs">VHS</option><option value="search-alias=watches">Watches</option>'
}


function categories() {
  $("#category").replaceWith($('<select id="category" name="category">'+cats[$("#domain").val()]+'</select>'));
}


function post() {
  xhr = $.ajax({
    cache:      true,
    timeout:   30000,
    type:     'POST',
    url:         '/',
    data:  $("#realform").serialize(),
    error: function(){ if(stats.status != statCancelled) post(); },
    success: results,
    dataType: 'json'
  });
}


// whenever we get a response from the server
// it puts in place and then sets up the left-size sorting dropdown and the refining links
// it keeps track of the number of pages that were downloaded, and if necessary, it initiates the downloading of the next page
function results(data){
  //console.log(data);

  if(data.refinements) {

    // when loading the refinements block, it tries to run a script, but it fails
    try { $("#refinements").replaceWith(data.refinements); } catch (ReferenceError) { /* do nothing */ }
    try { $("#breadcrumbs").empty().append(data.breadcrumbs); } catch (ReferenceError) { /* do nothing */ }
    try { $("#sortBy").replaceWith(data.sortby); } catch (ReferenceError) { /* do nothing */ }

    // make the absolute urls that Amazon use fully qualified
    // (we're not on Amazon so they don't make sense otherwise)
    $("#refinements a").add('#breadcrumbs a').each(function(i,a){
      $(a).attr('href', 'http://www.amazon.'+$("#domain").val()+$(a).attr('href'));
    });

    // hijack the clicks: run the refining with the form instead
    $("#refinements a:not([onclick])").add('#breadcrumbs a').click(function(e){
      set_url($(this).attr('href'));
      newsearch();
      e.preventDefault();
    });

    $("#sortBy").change(function(e){
      var sortform = $("#searchSortForm");
      set_url('http://www.amazon.' + $("#domain").val() + sortform.attr('action') + '?' + sortform.serialize());
      newsearch();
      e.preventDefault();
    });
  }

  table.fnAddData(data.products);

  stats.results += data.products;
  if(data.maxresults) stats.maxresults = data.maxresults;
  if(data.maxpages) stats.maxpages = data.maxpages;

  stats.page += 1;
  if(stats.page <= filter.pages && data.nextpage) {
    set_url(data.nextpage);
    if(stats.status != 'Cancelled') post();
  } else {
    stats.status = statFinished;
  }
}



function build_csv_link(){

  var keys   = [];
  var labels = [];

  for (var key in csvfields) {
    keys.push(key);
    labels.push(csvfields[key]);
  }

  var csv = build_csv_row(labels)+"\n";

  var data = table._('tr', {"filter":"applied"});
  if(data.length == 0) return false;

  var rows = data.map(function(e){
    var row = [];
    for(key in keys) row.push(e[keys[key]]);
    return build_csv_row(row);
  });
  csv += rows.join("\n");

  // making it Excel compatible -- it wants the BOM
  csv = '﻿'+csv;

  //var fname = data[0].search.replace(/[^a-zA-Z0-9._ -]/gm,'').replace(/[ _-]+/g,'-');
  fname = "Report";
  fname += '-'+timestamp()+'.csv'

  var folder = $.cookie('folder');
  if(folder && folder != '') {
    $("#csvbox").css('background','rgba(255,255,255,0.5)');
    $.ajax({
      type:     'POST',
      url:      '/csv',
      data:      { filename: fname, data: csv },
      error:     function(x,b,c){ alert('Unknown error. Please try again.'); },
      success:   function(data,s,x){ if(data.status == 'Failure') alert(data.status+': '+data.message); },
      complete:  function(x,s){ $("#csvbox").css('background','transparent'); },
      dataType: 'json'
    });
    return false;
  } else {
    var chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    if(chrome) {
      $("#csv").attr('href','data:text/csv;base64,'+Base64.encode(csv)).attr('download',fname);
    } else {
      $("#folder").click();
    }
  }
}


function build_csv_row(a){
  return a.map(function(e){
    return '"' + (e ? e.toString().replace(/"/gm,'""') : '') + '"';
  }).join();
}

function timestamp() {
  var d = new Date();
  function pad(n) { return n < 10 ? '0' + n : n }
  return d.getFullYear() + ''
   + pad(d.getMonth() + 1) + ''
   + pad(d.getDate()) + '-'
   + pad(d.getHours()) + ''
   + pad(d.getMinutes()) + ''
   + pad(d.getSeconds());
}

