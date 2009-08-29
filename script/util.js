// Misc re-usable functions

function key_value_swap(dict){
  var result = {}
  for (var key in dict){
    result[dict[key]] = key
  }  
  return result
}

function set(list){
  var result = {}
  $(list).each(function(){
    result[this] = 1
  })
  return result
}

function merge(dicts){
  var result = {}
  $(dicts).each(function(){
    for (var item in this) result[item] = this[item]
  })
  return result
}