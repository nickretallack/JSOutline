function visit_tree(output_item){
  function visit(node, heading_level){
    var result = ""
    var children = node.find('.item')
    if (!children.length) return result
    children.each(function(){
      var child = $(this)
      var title = child.find('.title:first')
      var note = child.find('.note:first')
      result += output_item(title, note, heading_level)
      result += visit(child, heading_level+1)
    })
    return result
  }

  var root = $('.root')
  var heading_level = 1
  var result = visit(root, heading_level)
  return result
}

function export_creole(){
  function output_item(title, note, heading_level){
    var result = ""
    var heading_markup = ""
    for (var x = 0; x < heading_level; x++) heading_markup += "="  
    result += heading_markup+" "+title.val()+"\n"
    result += note.val()+"\n\n"
    return result
  }  
  
  var markup = visit_tree(output_item)
  
  var win = window.open()
  var result = "<!doctype html><html><head><title>Creole Markup</title><style type='text/css'>body {white-space:pre-wrap}</style></head><body>" +markup+"</body></html>"
  win.document.write(result)
  
}

function export_html(){
  function output_item(title, note, heading_level){
    var result = ""
    result += "<h"+heading_level+">"+title.val()+"</h"+heading_level+">\n"
    result += "<p>"+note.val()+"</p>\n"
    return result
  }
  
  var markup = visit_tree(output_item)
  
  var win = window.open()
  var result = "<!doctype html><html><head><title>Creole Markup</title><style type='text/css'>body {white-space:pre-wrap}</style></head><body>" +markup+"</body></html>"
  win.document.write(result)
}


