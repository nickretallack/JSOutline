var keys = {enter:13, tab:9, up:38, down:40, left:37, right:39, del:8}

// This should all be refactored to allow custom key bindings.
// Store those along with the other persistence method used.

// Most of the time, you have an item title focused.
function title_keydown(event){
  var item = $(this).parents('.item:first')

  grow_field(this)
  
  if(event.which == keys.enter){
    stop(event)
    if      (event.shiftKey)  {
      $(':focus').blur()          // find a better way to do this
      item.find('.note:first').focus()
    } 
    else if (event.altKey)    return toggle_fold_item(item)
    else                      return create_sibling(item)

  } else if (event.which == keys.tab){
    stop(event)
    if (!event.shiftKey)      return indent(item)
    else                      return dedent(item)

  } else if (event.which == keys.up){
    stop(event)
    if      (event.shiftKey)  return move_up(item)
    else if (event.altKey)    return focus_item(item.prev())
    else                      return focus_prev(item)

  } else if (event.which == keys.down){
    stop(event)
    if      (event.shiftKey)  return move_down(item)
    else if (event.altKey)    return focus_item(item.next())
    else                      return focus_next(item)

  } else if (event.which == keys.right && event.shiftKey) {
    stop(event)
                              return indent(item)

  } else if (event.which == keys.left && event.shiftKey) {
    stop(event)
                              return dedent(item)
  
  } else if (event.which == keys.del && ($(this).val() == "" || event.ctrlKey || event.altKey)) {
    stop(event)
    // if (event.altKey)         reparenting_delete(item)
    // else                      
                              return delete_tree(item)
  }
}

// When nothing is selected, fall back to these controls
function window_keydown(event){
  if (event.which == keys.enter){
    if ($(':focus').length) return // only act when nothing is focused
    stop(event)
    create_sibling($('.root > .item:last'))
  
  } else if (event.which == keys.left && event.altKey) {
    stop(event)
    return undo()
  
  } else if (event.which == keys.right && event.altKey) {
    stop(event)
    return redo()

  } else if (event.which == keys.up){
    if ($(':focus').length) return // only act when nothing is focused
    stop(event)
    focus_item($('.root > .item:last'))

  } else if (event.which == keys.down){
    if ($(':focus').length) return // only act when nothing is focused
    stop(event)
    focus_item($('.root > .item:first'))
  }
}

function grow_field(field, character){
    field = $(field)
    var temp_field
    if (field.hasClass('.note')) temp_field = $('.autogrow .note')
    else temp_field = $('.autogrow .title')

    var text = field.val()
    if (character == keys.enter) text += "\n"
    if (character == keys.del) text = text.substring(0, text.length-1)
    text += "."
    // if (!character) text += "x"

    temp_field.text(text)
    console.debug(temp_field.height())
    field.css('height',temp_field.height())    
}


function note_keydown(event){  
  if(event.which == keys.enter){
    if (event.shiftKey){
      stop(event)
      var item = $(this).parents('.item:first')
      return focus_item(item)
    }
  }
  grow_field(this, event.which)
}

// If any text field changes, it needs to be recorded as an event.
// This is bound on the 'blur' event and manually called because blur seems to be broken.
// Stores current text in an attribute so we can detect changes, because 'change' event
// seems to also be broken.
function changed_text(event){
  var field = $(this)
  var item = field.parents('.item:first')
  var old_text = field.attr("data-text")
  var new_text = field.val()
  if (old_text != new_text){
    field.attr("data-text", new_text)
    var field_kind = field.hasClass('title') ? 'title' : 'note'
    emit_event({type:'change', item:item.attr('data-id'), field:field_kind, old_text:old_text, new_text:new_text})      
  }
}

function stop(event){
  event.preventDefault()
  faniggle_text()
  // event.stopPropagation()
}

// Causes a forced execution of the changed_text blur/change handler
// This is useful when we need to generate a text-changed event yet the user
// has not deselected the text box yet.  Also used when blur() doesn't fire properly.
function faniggle_text(){
  // console.debug("faniggled")
  var field = $(':focus')
  field.blur()
  field.focus()
}

// Similar to faniggle_text, but this time we're focusing a title specifically
function focus_item(item){
  if (item.length) $(':focus').blur()
  return item.find('.title:first').focus()
}