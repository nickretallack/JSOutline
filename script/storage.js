// Re-usable storage abstraction layer.

function preferred_storage_engine(){
  if (typeof localStorage != 'undefined') return new LocalStorageAdaptor()
  if (check_cookies()) return new CookieAdaptor()
  return new MemoryAdaptor()
}

function LocalStorageAdaptor(){
  this.name = "localStorage"
  this.get    = function(key        ){  var value = localStorage[key]
                                        if (value) return $.evalJSON(value)         }
  this.set    = function(key, value ){  return  localStorage[key] = $.toJSON(value) }
  this.unset  = function(key        ){          localStorage.removeItem(key)        }
  this.clear  = function(           ){          localStorage.clear()                }
  this.space  = function(           ){  return  localStorage.remainingSpace         }
}

function CookieAdaptor(){
  this.name = "cookies"
  this.get    = function(key        ){  var value = $.cookie(key)
                                        if (value) return $.evalJSON(value)         }
  this.set    = function(key, value ){  return  $.cookie(key, $.toJSON(value))      }
  this.unset  = function(key        ){          $.cookie(key, null)                 } 
  this.space  = function(           ){  return  4000                                }
}

function MemoryAdaptor(){
  this.name = "memory"
  var memory = {}
  this.get    = function(key        ){  return  memory[key]                         }
  this.set    = function(key, value ){  return  memory[key] = value                 }
  this.unset  = function(key        ){          delete memory[key]                  }
  this.clear  = function(           ){          delete memory                       }
  this.space  = function(           ){  return  0                                   }
}

function check_cookies(){
  $.cookie('test',null)
  $.cookie('test','true')
  if (!$.cookie('test')) return false
  $.cookie('test',null)
  return true
}



// if (!window.google || !google.gears) {
//   location.href = "http://gears.google.com/?action=install&message=<your welcome message>" +
//                   "&return=<your website url>";
// }
