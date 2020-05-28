

var helpersMaker = function() {
    
    //HASHING
    //http://programmers.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed
    var objToHash = function(obj, hash?) {
      if (hash == undefined) { hash = 34898410941; }
      return stringToHash(JSON.stringify(obj),hash);
    }
    
    var stringToHash = function(str, hash?) {
        if (hash == undefined) { hash = 34898410941 };
        if (str.length == 0) {
            return hash;
        }
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }


    var createUID = function() {
      return 'ID' + Math.random().toString(36).substr(2, 16);
    }

    //arrays
    var shuffleInPlace = function(a, random: Random) {
        for (var i = a.length-1; i > 0; i--) {
            let index = random.next(i);
            a.push(a.splice(index, 1)[0]);
            //this.appendChildElement(this._childNodes[random.next(this._childNodes.length)]);
        }
        return a;
    }

    var toShuffled = function(a, random: Random) {
      let ret = [];
      for (let item of a) {
          let index = random.next(a.length);
          while(ret[index]) {index++; index %= a.length}
          ret[index] = item;
      }
      return ret;
    }

    //strings
    
    var trimChar = function(str,char) {
      var i = 0;
      while (i < str.length && str[i] == char) {
        i++;
      }
      if (i == str.length) {
        return "";
      }
      var j = str.length - 1;
      while (j >= 0 && str[j] == char) {
        j--;
      }
      return str.substring(i,j+1);
    }

    var IsStringNullOrEmpty = function(str) {
      return (str == undefined || str == null || typeof(str) != "string" || str.length === 0 || !str.trim());
    };
    
    var IsStringNullOrWhiteSpace = function(str) {
        return str == undefined || str == null || typeof(str) != "string" || str == "" || str.trim().length == 0;
    }

    
    var startsWith = function(a,ai,b,bi) {
      if (ai == 0 && bi != 0) {
        return false;
      }
      if (bi == 0) {
        return a[ai] == b[bi];
      }
      return a[ai] == b[bi] && startsWith(a,ai-1,b,bi-1);
    }

    var replaceAll = function(within,toReplace,replaceWith) {
      var ret = "";
      var i = 0;
      var toReplaceLength = toReplace.length;
      while (i < within.length) {
        if (startsWith(within,i+toReplaceLength-1,toReplace,toReplaceLength-1)) {
          ret += replaceWith;
          i+=toReplaceLength;
        }
        else {
          ret += within[i];
          i+= 1;
        }
      } 
      return ret;
    }


    var stripQuotes = function(str) {
        if (str.charAt(0) === '"' && str.charAt(str.length-1) === '"') {
            return str.substr(1, str.length-2);
        }
        return str.toString();
    }
    
    //numbers
    var removeCrazySigFigs = function(n):string {
      return parseFloat(n).toPrecision(12);
    }

    var isNumeric = function(str) {
      return !isNaN(parseFloat(str)) && isFinite(str);
    }

    //SPECIAL
    var getDescendants = function(div: ICup):ICup[] {
      let ret = [div];
      if (div instanceof Container) {
        for (let child of div._childNodes) {
          ret = ret.concat(getDescendants(child));
        }
      }
      return ret;
    }

    var getDomainFromUrl = function(url) {
      var a = document.createElement('a');
      a.setAttribute('href', url);
      return a.hostname;
    }

    var insertAfter = function(arr, ref, item) {
      let index = arr.indexOf(ref);
      arr = arr.splice(index + 1,0,item);
    }

    var insertBefore = function(arr, ref, item) {
      let index = arr.indexOf(ref);
      arr = arr.splice(index,0,item);
    }

    var getItemImmediatelyAfter = function(arr, after) {
      let index = arr.indexOf(after);
      return index == -1 ? undefined : arr[index+1];
    }

    //removes all instances not just the first
    var removeFromArray = function(array, item) {
      for (let i = array.length; i >= 0 ; i--) {
        if (array[i] == item) { array.splice(i, 1); }
      }
    }

    var lowerCaseLetterFromIndex = function(i: number) { return String.fromCharCode(97 + i); }

    var lengthOfObject = function(obj: any) {
      let ret = 0;
      for (let key in obj) { ret++ }
      return ret;
    }

    var getValuesFromObject = function(obj: any) {
      let ret = [];
      for (let key in obj) { ret.push(obj[key]) }
      return ret;
    }

    var getKeysFromObject = function(obj: any) {
      let ret = [];
      for (let key in obj) { ret.push(key) }
      return ret;
    }

    var mergeObjects = function(obj1, obj2) {
      let ret = {};
      for (let key in obj1) {
        ret[key] = obj1[key];
      }
      for (let key in obj2) {
        ret[key] = obj2[key];
      }
      return ret;
    }

      
    return {
        objToHash: objToHash,
        IsStringNullOrEmpty: IsStringNullOrEmpty,
        IsStringNullOrWhiteSpace: IsStringNullOrWhiteSpace, 
        createUID: createUID,
        shuffleInPlace: shuffleInPlace, 
        replaceAll: replaceAll, 
        startsWith: startsWith,
        stripQuotes: stripQuotes,
        trimChar: trimChar,
        isNumeric: isNumeric,
        getDescendants: getDescendants,
        getDomainFromUrl: getDomainFromUrl,
        insertAfter: insertAfter,
        insertBefore: insertBefore,
        getItemImmediatelyAfter: getItemImmediatelyAfter,
        removeFromArray: removeFromArray, 
        removeCrazySigFigs: removeCrazySigFigs, 
        lowerCaseLetterFromIndex: lowerCaseLetterFromIndex,
        toShuffled: toShuffled, 
        lengthOfObject: lengthOfObject, 
        getValuesFromObject: getValuesFromObject,
        getKeysFromObject: getKeysFromObject,
        mergeObjects: mergeObjects
      };

};
var helpers = helpersMaker();




/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
class Random {
  _seed: number;
  constructor(seed?: number) {
    if (!seed) {this._seed = Random.generateSeed()}
    else { this._seed = seed }
    this._seed = this._seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
    //console.log(this._seed);
  }
  
  next(limit?) {
    if (limit == undefined) {
      limit =  2147483647;
    }
    this._seed = this._seed * 16807 % 2147483647;
    return this._seed % limit;
  }

  static generateSeed():number {
    let now = new Date();
    let seed = now.getTime();
    seed = seed % 2147483647;
    if (seed <= 0) seed += 2147483646;
    return seed;
  }
}
  
  