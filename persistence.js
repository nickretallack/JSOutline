function preferred_storage_engine(){
  if (typeof localStorage != 'undefined') return new LocalStorageAdaptor()
  if (check_cookies()) return new CookieAdaptor()
  return new MemoryAdaptor()
}

function CookieAdaptor(){
  this.name = "cookies"
  this.get    = function(key        ){  return  $.evalJSON($.cookie(key))           }
  this.set    = function(key, value ){  return  $.cookie(key, $.toJSON(value))      }
  this.unset  = function(key        ){          $.cookie(key, null)                 } 
  this.space  = function(           ){  return  4000                                }
}

function LocalStorageAdaptor(){
  this.name = "localStorage"
  this.get    = function(key        ){  return  $.evalJSON(localStorage[key])       }
  this.set    = function(key, value ){  return  localStorage[key] = $.toJSON(value) }
  this.unset  = function(key        ){          localStorage.removeItem(key)        }
  this.clear  = function(           ){          localStorage.clear()                }
  this.space  = function(           ){  return  localStorage.remainingSpace         }
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