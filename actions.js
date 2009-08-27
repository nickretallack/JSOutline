// Takes a function to decide on the insert point, but this is not very compatible with my event model
// since events have to be normalized to strings, and the function will include a dom pointer.  How sad.
// TODO: refactor this into two forms, making use of shared code.
function create_sibling(item, id){
  var node = create_an_item(function(node){ item.after(node) }, id)
  emit_event({type:'create_sibling', item:node.attr('data-id'), prev:item.attr('data-id')})
}

// Move current item to be the last child of its previous sibling
function indent(item){
  var prev = item.prev()
  if (prev.length && !prev.hasClass('folded')){
    item.appendTo(prev.find('.contents:first'))
    focus_item(item)
    emit_event({type:'indent', item:item.attr('data-id')})
  }
}

// Move current item to be the last sibling of its parent
function dedent(item){
  var parent = item.parents('.item:first')
  if (parent.length){
    parent.after(item)
    focus_item(item)
    emit_event({type:'dedent', item:item.attr('data-id')})
  }
}

// Focus the item that is vertically above the current item
// perhaps it should be called focus_up?  nah
function focus_prev(item){
  var prev = item.prev('.item:first') // find prev sibling
  if (prev.length) {
    while (true){
      if (prev.hasClass('folded')) break
      var child = prev.find('.contents:first > .item:last')
      if (!child.length) break // give up
      prev = child
    }
  }
  if (!prev.length){
    prev = item.parents('.item:first') // settle for own parent
  }
  return focus_item(prev)
}

// Focus the item that is vertically below the current item
function focus_next(item){
  var next
  if (!item.hasClass('.folded')) next = item.find('.item:first') // prefer first child
  if (!next || !next.length) next = item.next() // settle for next sibling
  if (!next.length) { // settle for x-parent's next sibling
    next = item
    while (true){
      next = next.parents('.item:first')
      if (!next.length) break // no solution
      var neighbor = next.next()
      if (neighbor.length){
        next = neighbor // found it
        break
      }
    }
  }
  return focus_item(next)    
}

// Move this item before its previous sibling  
function move_up(item){
  var prev = item.prev()
  if (prev.length) prev.before(item)
  // else { // re-parent?  Is this useful?
  //   
  // }
  focus_item(item)
  emit_event({type:'move_up', item:item.attr('data-id')})
}

// Move this item after its next sibling
function move_down(item){
  item.next().after(item)
  focus_item(item)
  emit_event({type:'move_down', item:item.attr('data-id')})
}

// Delete a node and all sub-nodes, moving them to purgatory so they can be resurrected later
function delete_tree(item, new_item_id){
  history_data = {type:'delete_tree', item:item.attr('data-id')}
  
  // find something else to look at
  focus_prev(item).length || focus_item(item.next()).length

  // remember where this node was atached
  var prev = item.prev()
  if (!prev.length) {
    var parent = item.parents('.contents:first')
    history_data['parent'] = parent.attr('data-id')
  } else {
    history_data['prev'] = prev.attr('data-id')
  }
    
  // save in purgatory for later ressuraction
  item.prependTo($('.dead'))

  // if there are no nodes left, create a new one as part of this same event.
  if(!$('.root .item').length) {
    var node = create_an_item(function(node){ $('.root').prepend(node) }, new_item_id)
    history_data['new_item_id'] = node.attr('data-id')
  }
  
  emit_event(history_data)
}

// Moves a node to purgatory, but makes all of its children into children of its parent
// This one doesn't have a redo action yet because it is rather mutative.  I'd need to list the
// nodes that got reparented so that all of them could be parented back.
// function delete_reparent(item){
//   var children = item.find('.contents:first > .item')
//   var parent = item.parents('.item:first')
//   if (parent.length){
//     parent.find('.contents:first').append(children)
//     item.remove()
//     focus_item(parent)
//     events.push({type:'delete_reparent', item:item.attr('data-id')})
//   }
// }

// Hides and deactivates child nodes
function fold(item){
  item.addClass('folded')
  emit_event({type:'fold', item:item.attr('data-id')})    
}

// Shows and activates child nodes
function unfold(item){
  item.removeClass('folded')
  emit_event({type:'unfold', item:item.attr('data-id')})    
}

function toggle_fold_item(item){
  if (item.find('.item').length){
    if (item.hasClass('folded'))  unfold(item)
    else                          fold(item)
  }
}

// Reverse last action but remember it so it can be re-done later
// May invoke a text changed event before acting
function undo(){
  faniggle_text()
  
  history_mode = true
  event = persistence.undo()
  if (event) reverse_event(event)
  history_mode = false
}

// Reverses actions again that were previously reversed, hence returning to normal
function redo(){
  history_mode = true
  event = persistence.redo()
  if (event) forward_events[event.type](event)  
  history_mode = false
}

///////////////////////////////// ACTION UTILITIES ////////////////////////////////////////////

var auto_increment = 0
function create_an_item(insert, id){
  if (!id) {
    id = auto_increment
    auto_increment += 1
  }
  var node = $('.item.prototype').clone().removeClass('prototype').attr('data-id',id)
  insert(node)
  $(':focus').blur()
  node.find('.note').keydown(note_keydown).autogrow({extraSpace:100}).blur(changed_text).keydown(change_countdown)
  node.find('.title').keydown(title_keydown).focus().blur(changed_text).keydown(change_countdown)  
  return node
}

// Find an item the way it is described in text-based event history
function find_item(id){ return $('[data-id='+id+']') }

var time_until_autosave = 5000
var change_countdown_timer
function change_countdown(event){
  clearTimeout(change_countdown_timer)
  change_countdown_timer = setTimeout(faniggle_text, time_until_autosave)
}

function init_empty(){
  return create_an_item(function(node){ node.appendTo('.root') })
}

function undelete_tree(data){
  // restore an item from purgatory to its original place
  var item = find_item(data.item)
  var prev = find_item(data.prev)
  var parent = find_item(data.parent)
  if      (prev  .length) prev      .after  (item)
  else if (parent.length) parent    .prepend(item)
  else                    $('.root').prepend(item)
  focus_item(item)

  console.debug('undeleting')
  // if we created a new item to replace it, get rid of that now
  if (data.new_item_id){
    var new_item = find_item(data.new_item_id)
    new_item.remove()
    console.debug('got the straggler', new_item.get())
  }
  
  emit_event({type:'create_sibling', item:data.item})
}

function change_text(data){
  var item = find_item(data.item)
  var field = item.find('.'+data.field+':first')
  field.val(data.new_text)
  field.attr('data-text', data.new_text)
  field.focus()
  emit_event({type:'change', item:data.item, field:data.field, old_text:data.old_text, new_text:data.new_text})
}

function unchange_text(data){
  var item = find_item(data.item)
  var field = item.find('.'+data.field+':first')
  field.val(data.old_text)
  field.attr('data-text', data.old_text)
  field.focus()
  emit_event({type:'change', item:data.item, field:data.field, old_text:data.new_text, new_text:data.old_text})
}