var UI = require('ui');
var ajax = require('ajax');

var baseURL = "https://ce.corethree.net/Corethree/Demos/GetWatchContent?key=0064d383-87aa-4826-a53a-35ec14fbc4f4&context=&format=json";

var pages = [];
var splashMessage = "     Connecting...";
var splashMenu;

init();
setTimeout(function() { requestContent(); }, 2000);

function init() {
  // Create a Card with title and subtitle
  splashMenu = new UI.Card({
    title: " ",
    body: splashMessage,
    banner: "images/logo.png"
  });

  // Display the Card
  splashMenu.show();
}

function requestContent() {
  ajax(
    {
      url: baseURL,
      type: 'json'
    },
    function(data, status, request) {
      splashMenu.hide();
      loadContent(data);
    },
    function(error, status, request) {
      console.log('The ajax request failed: ' + error);
    }
  );
}

function loadContent(node) {
  // define the menu section we'll be displaying,
  var section = {
    title: node.Name,
    items: []
  };  
  if (typeof node.Subtitle != 'undefined' && node.Subtitle !== '') section.subtitle = node.Subtitle;
  
  // we'll put a nav item in for each of the Node's children
  if (typeof node.Children != 'undefined') {
    for (var n in node.Children) {
      var child = node.Children[n];
      var childItem = {
        title: child.Name,
        node: child
      };
      if (typeof child.Subtitle != 'undefined' && child.Subtitle !== '') childItem.subtitle = child.Subtitle;
      section.items.push(childItem);
    }
  }
  
  // then create the menu with one section, as created above
  var menu = new UI.Menu({
    sections: [ section ]
  });
  
  // add a handler to recursively load the item's Node content when selected
  menu.on('select', handleItemSelected);
  
  // and bind the handler for a long-press app re-load
  menu.on('longSelect', reinit);
  
  // and finally store the menu as a nav stack page
  // and show it
  pages.push(menu);
  menu.show();
}

function handleItemSelected(itemData) {
  var node = itemData.item.node;
  
  // have we got a link we need to load?
  if (node.Type === "Node.Link") {
    var nodeUrl = node.Uri;
    if (nodeUrl.substring(0,7) == "part://") {
        nodeUrl = nodeUrl.substring(7).replace('.', '/').replace('.', '/').replace('.', '/');
    }
    var url = "https://ce.corethree.net/" + nodeUrl;
    if (url.indexOf("format=json") == -1) {
      if (url.indexOf("?") == -1) {
        url += "?format=json";
      }
      else {
        url += "&format=json"; 
      }
    }
    console.log('Calling ' + url);
    ajax(
      {
        url: url,
        type: 'json'
      },
      function(data, status, request) {
        loadContent(data);
      },
      function(error, status, request) {
        console.log('The ajax request failed: ' + error);
        var errorCard = new UI.Card({
          title: " ",
          body: "Connection error"
        });
        errorCard.show();
        setTimeout(function() { errorCard.hide(); }, 4000);
      }
    );
  }
  else
  {
    // nope - just load the Node content as normal
    loadContent(node);
  }
}

function reinit() {
  // pop all loaded pages
  for (var p in pages) {
    var page = pages[p];
    page.hide();
  }
  pages = [];
  splashMessage = "     Refreshing...";
  init();
  setTimeout(function() { requestContent(); }, 2000);
}