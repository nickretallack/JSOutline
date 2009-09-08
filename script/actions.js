function dispatch_action(action){
  // if (!all_actions[action.type]) return
  var fun = eval(action.type)
  fun(action)
}

function restore(action_history){
  var version = action_history.storage.get("version")
  action_history.storage.set("version","1")
  // possibly do some repair work based on the version

  action_history.restore(function(action){
    dispatch_action(action)
  })  
}

/////////////////////////////////////// CREATING ///////////////////////////////////////
// Making new items

function create_child(data){
  var item = find_item(data.item_id)
  var new_item = create_an_item(function(node){ item.find('.contents:first').prepend(node) }, data.new_item_id)
  action_history.record({ type        : 'create_child', 
                          item_id     : data.item_id, 
                          new_item_id : encode_item(new_item) })
}

function create_sibling(data){
  var item = find_item(data.item_id)
  if (!item) item = $('.root .item:last')
  var new_item = create_an_item(function(node){ item.after(node) }, data.new_item_id)
  action_history.record({ type        :'create_sibling', 
                          item_id     :data.item_id, 
                          new_item_id :encode_item(new_item)})
}

function create_previous_sibling(data){
  var item = find_item(data.item_id)
  if (!item) item = $('.root .item:first')
  var new_item = create_an_item(function(node){ item.before(node) }, data.new_item_id)
  action_history.record({ type        :'create_previous_sibling', 
                          item_id     :data.item_id,
                          new_item_id :encode_item(new_item)})  
}

function create_parent(data){
  // create item before, then put us inside it  
  var item = find_item(data.item_id)
  var new_item = create_an_item(function(node){ item.before(node) }, data.new_item_id)
  new_item.find('.contents:first').prepend(item)
  action_history.record({ type        :'create_parent', 
                          item_id     :data.item_id,
                          new_item_id :encode_item(new_item)})  
  
}

function uncreate_parent(data){
  var item = find_item(data.item_id)
  var new_item = find_item(data.new_item_id)
  new_item.after(item)
  new_item.remove()
  focus_item(item)
}

function uncreate_item(data){
  var item = find_item(data.new_item_id)
  var prev_focus = find_item(data.item_id)
  if (prev_focus) focus_item(prev_focus)
  else focus_prev({item_id:data.new_item_id})
  item.remove()
}
var uncreate_child = uncreate_item
var uncreate_sibling = uncreate_item
var uncreate_previous_sibling = uncreate_item
//////////////////////////////////////// DELETING ////////////////////////////////////
// Sending items to purgatory

function delete_item(data){
  var item = find_item(data.item_id)
  history_data = {type:'delete_item', item_id:data.item_id, children:[]}

  // take the children and put them after
  var children = item.find(".contents > .item")
  children.each(function(){ 
    history_data.children.push(encode_item($(this))) 
  })
  item.after(children)

  // find something else to look at
  if (children.length) focus_item($(children[0]))
  else focus_prev(data).length || focus_item(item.next())
  
  // remember where this node was atached
  var prev = item.prev()
  if (!prev.length) {
    var parent = item.parents('.item:first') // !!!!!!! BIG PROBLEM!  or not
    history_data['parent_item_id'] = parent.attr('data-id')
    console.debug('parent',parent.get())
  } else {
    history_data['prev_item_id'] = prev.attr('data-id')
  }
  console.debug(prev.get())
  
  // save in purgatory for later ressuraction
  item.prependTo($('.dead'))

  // if there are no nodes left, create a new one as part of this same event.
  if(!$('.root .item').length) {
    var node = create_an_item(function(node){ $('.root').prepend(node) }, data.new_item_id)
    history_data['new_item_id'] = node.attr('data-id')
  }
  console.debug(history_data)
  action_history.record(history_data)  
}

function undelete_item(data){
  // restore an item from purgatory to its original place
  var item = find_item(data.item_id)
  var prev = find_item(data.prev_item_id)
  var parent = find_item(data.parent_item_id)
  if      (prev  ) prev  .after  (item)
  else if (parent) parent.find('.contents:first').prepend(item)
  else                    $('.root').prepend(item)
  console.debug('prev',prev,'parent',parent)

  // if we created a new item to replace it, get rid of that now
  if (data.new_item_id){
    var new_item = find_item(data.new_item_id)
    new_item.remove()
  }

  // put the children back
  $(data.children).each(function(){ 
    var child = find_item(this)
    item.find("> .contents").append(child)
  })
  
  focus_item(item)
}


function delete_tree(data){ // Delete a node and all sub-nodes, moving them to purgatory so they can be resurrected later
  var item = find_item(data.item_id)
  history_data = {type:'delete_tree', item_id:data.item_id}

  // find something else to look at
  focus_prev(data).length || focus_item(item.next())

  // remember where this node was atached
  var prev = item.prev()
  if (!prev.length) {
    var parent = item.parents('.item:first')
    history_data['parent_item_id'] = parent.attr('data-id')
  } else {
    history_data['prev_item_id'] = prev.attr('data-id')
  }
  
  // save in purgatory for later ressuraction
  item.prependTo($('.dead'))

  // if there are no nodes left, create a new one as part of this same event.
  if(!$('.root .item').length) {
    var node = create_an_item(function(node){ $('.root').prepend(node) }, data.new_item_id)
    history_data['new_item_id'] = node.attr('data-id')
  }

  action_history.record(history_data)
}

function undelete_tree(data){
  // restore an item from purgatory to its original place
  var item = find_item(data.item_id)
  var prev = find_item(data.prev_item_id)
  var parent = find_item(data.parent_item_id)
  if      (prev  ) prev  .after  (item)
  else if (parent) parent.find('> .contents').prepend(item)
  else                    $('.root').prepend(item)
  focus_item(item)

  // if we created a new item to replace it, get rid of that now
  if (data.new_item_id){
    var new_item = find_item(data.new_item_id)
    new_item.remove()
  }
}

///////////////////////////////////////////// MOVING /////////////////////////////////////////
// Rearrange your items

function indent(data){
  var item = find_item(data.item_id)

  if (data.prev_item_id){ // undo-ing a dedent with a previous sibling
    var old_prev = find_item(data.prev_item_id)
    old_prev.after(item)
    return focus_item(item)
  }

  var prev = item.prev()  // could still be undoing a dedent
  if (prev.length && !prev.hasClass('folded')){
    item.appendTo(prev.find('.contents:first'))
    focus_item(item)
    action_history.record({type:'indent', item_id:data.item_id})
  }
}

function dedent(data){
  var item = find_item(data.item_id)
  var parent = item.parents('.item:first')
  var prev = item.prev()
  if (parent.length){
    parent.after(item)
    focus_item(item)
    var action_data = {type:'dedent', item_id:data.item_id}
    if (prev.length) action_data['prev_item_id'] = prev.attr('data-id')
    action_history.record(action_data)
  }
}
var undedent = indent
var unindent = dedent

function move_up(data){ // Moves this item before its previous sibling
  var item = find_item(data.item_id)    
  var prev = item.prev()
  if (prev.length) prev.before(item)
  focus_item(item)
  // TODO: jump to a new parent?
  action_history.record({type:'move_up', item_id:data.item_id})
}

function move_down(data){ // Move this item after its next sibling
  var item = find_item(data.item_id)    
  item.next().after(item)
  focus_item(item)
  // TODO: jump to a new parent?
  action_history.record({type:'move_down', item_id:data.item_id})
}

var unmove_up   = move_down
var unmove_down = move_up

/////////////////////////////////////////// FOLDING ////////////////////////////////////
// Hides all the children

function toggle_fold_item(data){
  var item = find_item(data.item_id)    
  if (item.hasClass('folded'))  unfold(data)
  else                          fold(data)
}

// Hides and deactivates child nodes
function fold(data){
  var item = find_item(data.item_id)    
  if (item.find('.item').length){
    item.addClass('folded')
    action_history.record({type:'fold', item_id:data.item_id})    
  }
}

// Shows and activates child nodes
function unfold(data){
  var item = find_item(data.item_id)    
  if (item.find('.item').length){
    item.removeClass('folded')
    action_history.record({type:'unfold', item_id:data.item_id})    
  }
}
var ununfold = fold

//////////////////////////////////////// HISTORY ACTIONS /////////////////////////////////////
// Step through the history.

function undo(data){
  faniggle_text()

  action_history.undo(function(action){
    action.type = 'un' + action.type
    dispatch_action(action)
  })
}

function redo(data){
  action_history.redo(dispatch_action)
}

/////////////////////////////////////// NAVIGATING ////////////////////////////////////////
// None of these create events.

// TODOOOOOOOOOOOOOOOOOOOO  NEEDS BLUR
function toggle_note_view(data){
  var item = find_item(data.item_id)
  if ($(':focus').hasClass('note')) focus_item(item)
  else {
    $(':focus').blur()
    item.find('.note:first').focus()
  }
}

function focus_prev_sibling(data){
  var item = find_item(data.item_id)    
  focus_item(item.prev())
}

function focus_next_sibling(data){
  var item = find_item(data.item_id)    
  focus_item(item.next())
}

function focus_last (data){ focus_item($('.root .item:last'))  }
function focus_first(data){ focus_item($('.root .item:first')) }

// focus the item that is vertically above the current item, or the last root node
function focus_prev(data){
  var item = find_item(data.item_id)    
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

// Focus the item that is vertically below the current item, or the first root node
function focus_next(data){
  var item = find_item(data.item_id)    
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

///////////////////////////////// EDITING ////////////////////////////////////////

function change_text(data){
  var item = find_item(data.item_id)
  var field = item.find('.'+data.field+':first')
  field.val(data.new_text)
  field.attr('data-text', data.new_text)
  grow_field(field)
  field.focus()
}

function unchange_text(data){
  var item = find_item(data.item_id)
  var field = item.find('.'+data.field+':first')
  field.val(data.old_text)
  field.attr('data-text', data.old_text)
  field.focus()
}

///////////////////////////////// ACTION UTILITIES ////////////////////////////////////////////

var auto_increment = 0
function create_an_item(insert, id){
  if (!id) {
    id = auto_increment
    auto_increment += 1
  } else if (id >= auto_increment) auto_increment = parseInt(id)+1
  
  var node = $('.item.prototype').clone().removeClass('prototype').attr('data-id',id)
  insert(node)
  $(':focus').blur()
  node.find('.note').keydown(note_keydown).blur(changed_text).keydown(change_countdown)
  node.find('.title').keydown(title_keydown).focus().blur(changed_text).keydown(change_countdown)
  return node
}

// Find an item the way it is described in text-based event history
function find_item  (id  ){ if(id  ) return $('[data-id='+id+']') }
function encode_item(item){ if(item) return item.attr('data-id')  }

function init_empty(){
  return create_an_item(function(node){ node.appendTo('.root') })
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
