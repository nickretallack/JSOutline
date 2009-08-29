// Various export formats for outlines

function visit_tree(output_item){
  function visit(items, heading_level){
    var result = ""
    if (!items.length) return result
    items.each(function(){
      var item = $(this)
      var title = item.find('.title:first')
      var note = item.find('.note:first')
      result += output_item(title.val(), note.val(), heading_level)
      var children = item.find("> .contents > .item")
      result += visit(children, heading_level+1)
    })
    return result
  }

  var items = $('.root > .item')
  var heading_level = 1
  var result = visit(items, heading_level)
  return result
}

function templated(content){
  // return content
  return "<!doctype html><html><head><title>Creole Markup</title><style type='text/css'>body {white-space:pre-wrap}</style></head><body>"+content+"</body></html>"
}


function export_creole(){
  function output_item(title, note, heading_level){
    var result = ""
    if (title){
      var heading_markup = ""
      for (var x = 0; x < heading_level; x++) heading_markup += "="  
      result += heading_markup+" "+title+"\n"      
    }
    result += note+"\n\n"
    return result
  }  
  
  var markup = visit_tree(output_item)
  
  var win = window.open()
  var result = templated(markup)
  win.document.write(result) 
}

function export_html(){
  function output_item(title, note, heading_level){
    return "<h"+heading_level+">"+title+"</h"+heading_level+">\n" + "<p>"+note+"</p>\n"
  }
  
  var markup = visit_tree(output_item)
  
  var win = window.open()
  var result = templated(markup)
  win.document.write(result)
}

function export_textile(){
  function output_item(title, note, heading_level){
    return "h"+heading_level+". "+title + "\n\n" + note
  }
  
  var markup = visit_tree(output_item)
  
  var win = window.open()
  var result = templated(markup)
  win.document.write(result)  
}

function export_plaintext(){
  function output_item(title, note, heading_level){
    var heading_markup = ""
    for (var x = 0; x < heading_level; x++) heading_markup += "  "
    var result = heading_markup+"- "+title+"\n"
    if(note) result += heading_markup+"  "+note+"\n\n"
    return result
  }
  
  var markup = visit_tree(output_item)
  
  var win = window.open()
  var result = templated(markup)
  win.document.write(result)  
}


