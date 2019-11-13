
//16x16 icons
var imageData = {
  "cross": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIhSURBVDjLlZPrThNRFIWJicmJz6BWiYbIkYDEG0JbBiitDQgm0PuFXqSAtKXtpE2hNuoPTXwSnwtExd6w0pl2OtPlrphKLSXhx07OZM769qy19wwAGLhM1ddC184+d18QMzoq3lfsD3LZ7Y3XbE5DL6Atzuyilc5Ciyd7IHVfgNcDYTQ2tvDr5crn6uLSvX+Av2Lk36FFpSVENDe3OxDZu8apO5rROJDLo30+Nlvj5RnTlVNAKs1aCVFr7b4BPn6Cls21AWgEQlz2+Dl1h7IdA+i97A/geP65WhbmrnZZ0GIJpr6OqZqYAd5/gJpKox4Mg7pD2YoC2b0/54rJQuJZdm6Izcgma4TW1WZ0h+y8BfbyJMwBmSxkjw+VObNanp5h/adwGhaTXF4NWbLj9gEONyCmUZmd10pGgf1/vwcgOT3tUQE0DdicwIod2EmSbwsKE1P8QoDkcHPJ5YESjgBJkYQpIEZ2KEB51Y6y3ojvY+P8XEDN7uKS0w0ltA7QGCWHCxSWWpwyaCeLy0BkA7UXyyg8fIzDoWHeBaDN4tQdSvAVdU1Aok+nsNTipIEVnkywo/FHatVkBoIhnFisOBoZxcGtQd4B0GYJNZsDSiAEadUBCkstPtN3Avs2Msa+Dt9XfxoFSNYF/Bh9gP0bOqHLAm2WUF1YQskwrVFYPWkf3h1iXwbvqGfFPSGW9Eah8HSS9fuZDnS32f71m8KFY7xs/QZyu6TH2+2+FAAAAABJRU5ErkJggg==",
  "tick" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLvZPZLkNhFIV75zjvYm7VGFNCqoZUJ+roKUUpjRuqp61Wq0NKDMelGGqOxBSUIBKXWtWGZxAvobr8lWjChRgSF//dv9be+9trCwAI/vIE/26gXmviW5bqnb8yUK028qZjPfoPWEj4Ku5HBspgAz941IXZeze8N1bottSo8BTZviVWrEh546EO03EXpuJOdG63otJbjBKHkEp/Ml6yNYYzpuezWL4s5VMtT8acCMQcb5XL3eJE8VgBlR7BeMGW9Z4yT9y1CeyucuhdTGDxfftaBO7G4L+zg91UocxVmCiy51NpiP3n2treUPujL8xhOjYOzZYsQWANyRYlU4Y9Br6oHd5bDh0bCpSOixJiWx71YY09J5pM/WEbzFcDmHvwwBu2wnikg+lEj4mwBe5bC5h1OUqcwpdC60dxegRmR06TyjCF9G9z+qM2uCJmuMJmaNZaUrCSIi6X+jJIBBYtW5Cge7cd7sgoHDfDaAvKQGAlRZYc6ltJlMxX03UzlaRlBdQrzSCwksLRbOpHUSb7pcsnxCCwngvM2Rm/ugUCi84fycr4l2t8Bb6iqTxSCgNIAAAAAElFTkSuQmCC",
  "star" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLlZLNS5RRFMafe9/3vjPOjI1jaKKEVH40tGgRBWEibfoPQoKkVdtoEQQF4T/QqkVtWrSTFrVsF1FgJbWpIAh1k2PNh+PrfL4f95zTQk0HHKkDD/cc7vP8uHCuEhF0q/KnmXNgGR248PZFN4/GISXMC8L89DBPV0Dp4/SsazJjrtfb9/vdxfn/BgjzY5M8Aq8nBya+V3h93vtnQHFxat4kszntJAAAxus1YvnZQV5V/jyTEZarwnwFLGeFZdT0ZFOJdD84qoCDOpQ7grZfRNj020JSEOKvwvxGiF+q0tL0N5PuO+Mk0nC0B0BDsYCCImyzAIktBBloMwKJLSgKYcMAcdhC2KpVlIig+H5qxcv0n0xmj4Gbq+BwC2wtJLbgHUlMEFJwUpMIGpto16u+kJzSACAk+WCzvNbe+AVljkOYIcQQou3TbvdOJo+g4aNdqzaF+PT43HJVA8DQpcVIiPPtaqlEUQzlDELsTpgYwgTAQIjQqlUCtpQfn1spdmxh+PJSQyw9CrbKgM7tvcISQAxlBhC3GuCYXk3cWP25m3M7dk88qbWBRDVApaATOSjPBdXXwYEP5QyCgvjE/kwHgInHtHYBnYA2owhrPiiuw0sOw3EZFEagIB7qChDiYaUcNIoFtP1KxCTPhWiDw7WbXk9vKpnOgsI4exjg6Mbq96YQPxm79uPOvqvbXx4O3KrF6w8osv2df17kr5YXJq7vnw/S0v3k7Ie7xtud/wAaRnP+Cw8iKQAAAABJRU5ErkJggg==",
  "trash" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAFuSURBVBgZBcG/S1RxAADwz3teyp3XFUUWNVSoRGQR3dLQIESBbUZt9gekm9XW2lRbNDv0gxbJWoJoCcT+ABskTgcDDwLpOD19d+/73rfPJ4kAANaejUx03t5eBZIIgKe34r3JB7OTVVvZuzf9lderiKIoip7MLba+xY24H4v4N36PC635uSgFIJ2/Pz7ppH19w66aHk/nqQCfk8LU1BWJAyMyo3Y1bV2nwpeh8nxxthg+Vm+ZUFVKHDjhK1UqlJeK52E61LOkasOhRDAic8EWKp/qxaupmdOO6Fi3bVyiEAQdA6Th7tjMGYcyDTcdtWlUoqYtypHmjy/atadrX6JpU5QaMhDlSPNTFX9kMj0H6rr+gYFCjnSw3XNZ2y9dPfT1lUq5UkA6+Phb3TU3NJArHFeKhtTkSBc+rC//0NBQVbNmwphzGu5oCztUGDz8udydbSrlVmI9eSkIirzYKZokESw+yl+EdtgL75eWAID/yIWfXhcZhKEAAAAASUVORK5CYII=",
  "duplicate" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAy0lEQVQ4T63TMWoCQRQG4G9rzyCBgCGNR0ifJiCinSmCgVS2sfAWaQzYJRcQJNhbW5rWVpTUaZJCBrZYltnd6GbKmXkf/3vMJGqupGa9LLDCZQm4Rid/ngW+8IOPCNLFAddVwByPESDsh+LawAz9NGkP+3wLVQle8IwLtLE5FQgt3OOtCFjgITKDsN9KZzDAexHQwGcOCClD3G0VMEWz5B0EeIzCBNnaCW5xEwH/BLziCUt855DQzlVsBtl7IwxL2vnFHXb/+pnO+phHa64xEbM+Qh0AAAAASUVORK5CYII=",
  "hourglass" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ6SURBVDjLjZO7T1NhGMY7Mji6uJgYt8bElTjof6CDg4sMSqIxJsRGB5F4TwQSIg1QKC0KWmkZEEsKtEcSxF5ohV5pKSicXqX3aqGn957z+PUEGopiGJ583/A+v3znvPkJAAjWR0VNJG0kGhKahCFhXcN3YBFfx8Kry6ym4xIzce88/fbWGY2k5WRb77UTTbWuYA9gDGg7EVmSIOF4g5T7HZKuMcSW5djWDyL0uRf0dCc8inYYxTcw9fAiCMBYB3gVj1z7gLhNTjKCqHkYP79KENC9Bq3uxrrqORzy+9D3tPAAccspVx1gWg0KbaZFbGllWFM+xrKkFQudV0CeDfJsjN4+C2nracjunoPq5VXIBrowMK4V1gG1LGyWdbZwCalsBYUyh2KFQzpXxVqkAGswD3+qBDpZwow9iYE5v26/VwfUQnnznyhvjguQYabIIpKpYD1ahI8UTT92MUSFuP5Z/9TBTgOgFrVjp3nakaG/0VmEfpX58pwzjUEquNk362s+PP8XYD/KpYTBHmRg9Wch0QX1R80dCZhYipudYQY2Auib8RmODVCa4hfUK4ngaiiLNFNFdKeCWWscXZMbWy9Unv9/gsIQU09a4pwvUeA3Uapy2C2wCKXL0DqTePLexbWPOv79E8f0UWrencZ2poxciUWZlKssB4bcHeE83NsFuMgpo2iIpMuNa1TNu4XjhggWvb+R2K3wZdLlAZl8Fd9jRb5sD+Xx0RJBx5gdom6VsMEFDyWF0WyCeSOFcDKPnRxZYTQL5Rc/nn1w4oFsBaIhC3r6FRh5erPRhYMyHdeFw4C6zkRhmijM7CnMu0AUZonCDCnRJBqSus5/ABD6Ba5CkQS8AAAAAElFTkSuQmCC",
  "error" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIsSURBVDjLpVNLSJQBEP7+h6uu62vLVAJDW1KQTMrINQ1vPQzq1GOpa9EppGOHLh0kCEKL7JBEhVCHihAsESyJiE4FWShGRmauu7KYiv6Pma+DGoFrBQ7MzGFmPr5vmDFIYj1mr1WYfrHPovA9VVOqbC7e/1rS9ZlrAVDYHig5WB0oPtBI0TNrUiC5yhP9jeF4X8NPcWfopoY48XT39PjjXeF0vWkZqOjd7LJYrmGasHPCCJbHwhS9/F8M4s8baid764Xi0Ilfp5voorpJfn2wwx/r3l77TwZUvR+qajXVn8PnvocYfXYH6k2ioOaCpaIdf11ivDcayyiMVudsOYqFb60gARJYHG9DbqQFmSVNjaO3K2NpAeK90ZCqtgcrjkP9aUCXp0moetDFEeRXnYCKXhm+uTW0CkBFu4JlxzZkFlbASz4CQGQVBFeEwZm8geyiMuRVntzsL3oXV+YMkvjRsydC1U+lhwZsWXgHb+oWVAEzIwvzyVlk5igsi7DymmHlHsFQR50rjl+981Jy1Fw6Gu0ObTtnU+cgs28AKgDiy+Awpj5OACBAhZ/qh2HOo6i+NeA73jUAML4/qWux8mt6NjW1w599CS9xb0mSEqQBEDAtwqALUmBaG5FV3oYPnTHMjAwetlWksyByaukxQg2wQ9FlccaK/OXA3/uAEUDp3rNIDQ1ctSk6kHh1/jRFoaL4M4snEMeD73gQx4M4PsT1IZ5AfYH68tZY7zv/ApRMY9mnuVMvAAAAAElFTkSuQmCC",
  "refresh" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI/SURBVDjLjZPbS9NhHMYH+zNidtCSQrqwQtY5y2QtT2QGrTZf13TkoYFlzsWa/tzcoR3cSc2xYUlGJfzAaIRltY0N12H5I+jaOxG8De+evhtdOP1hu3hv3sPzPO/z4SsBIPnfuvG8cbBlWiEVO5OUItA0VS8oxi9EdhXo+6yV3V3UGHRvVXHNfNv6zRfNuBZVoiFcB/3LdnQ8U+Gk+bhPVKB3qUOuf6/muaQR/qwDkZ9BRFdCmMr5EPz6BN7lMYylLGgNNaKqt3K0SKDnQ7us690t3rNsxeyvaUz+8OJpzo/QNzd8WTtcaQ7WlBmPvxhx1V2Pg7oDziIBimwwf3qAGWESkVwQ7owNujk1ztvk+cg4NnAUTT4FrrjqUKHdF9jxBfXr1rgjaSk4OlMcLrnOrJ7latxbL1V2lgvlbG9MtMTrMw1r1PImtfyn1n5q47TlBLf90n5NmalMtUdKZoyQMkLKlIGLjMyYhFpmlz3nGEVmFJlRZNaf7pIaEndM24XIjCOzjX9mm2S2JsqdkMYIqbB1j5C6yWzVk7YRFTsGFu7l+4nveExIA9aMCcOJh6DIoMigyOh+o4UryRWQOtIjaJtoziM1FD0mpE4uZcTc72gBaUyYKEI6khgqINXO3saR7kM8IZUVCRDS0Ucf+xFbCReQhr97MZ51wpWxYnhpCD3zOrT4lTisr+AJqVx0Fiiyr4/vhP4VyyMFIUWNqRrV96vWKXKckBoIqWzXYcoPDrUslDJoopuEVEpIB0sR+AuErIiZ6OqMKAAAAABJRU5ErkJggg==",
  "grid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAApklEQVQ4jb3SQQqBURTF8R99E0aSMrEFC7AGpvYmG1A2YgG2YCIDJSlRTF65fS4lcut1T+f/Ou/d1+O5ZkFPysoYqJKAbtCtNww0k4CP6uuABuboBG+EVdGD0jcJg30Wugx6WlbG8IMRKozRDt4gnDqq7Y8MThVOOAfz4jHbsfR9wuCa3eq/b9DAAr3gDbEuul/6NmGwy0L/O8JP/kG9DkGfcXvBwB3GoiAx97DmjwAAAABJRU5ErkJggg=="
  };

var helpersMaker = function() {
    
    //http://programmers.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed
    var stringToHash = function(str) {
        var hash = 0;
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
    
    var CombineHashCodes = function(strings)
    {
        let hash = 5381;

        for (var i = 0, s; s = strings[i]; i++) {
            hash = ((hash << 5) + hash) ^ stringToHash(s);
        }
        return hash;
    }

    var IsNullOrEmpty = function(str) {
        return (str.length === 0 || !str.trim());
    };
    
    
    var IsNullOrWhiteSpace = function(str) {
        return str === null || str.trim().length == 0;
    }

    var createUID = function() {
      return 'ID' + Math.random().toString(36).substr(2, 16);
    }

    var shuffle = function(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    //used by replaceAll
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
    
    var isNumeric = function(str) {
      return !isNaN(parseFloat(str)) && isFinite(str);
    }


    return {
        CombineHashCodes: CombineHashCodes,
        IsNullOrEmpty: IsNullOrEmpty,
        IsNullOrWhiteSpace: IsNullOrWhiteSpace, 
        createUID: createUID,
        shuffle: shuffle, 
        replaceAll: replaceAll, 
        startsWith: startsWith,
        stripQuotes: stripQuotes,
        trimChar: trimChar,
        isNumeric: isNumeric
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
    if (seed == undefined) {
        var now = new Date();
        seed = now.getTime();
    }
    this._seed = seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
  }
  
  next(limit) {
    if (limit == undefined) {
      limit =  2147483647;
    }
    this._seed = this._seed * 16807 % 2147483647;
    return this._seed % limit;
  }
}
  
  