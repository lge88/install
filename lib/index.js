
var extend = require( 'extend' );


/**
 *
 * @param {Object|Function} global
 * @param {string} path
 * @param {Any} content
 * @return {InstallController}
 */
// pkg protocol:
// { path: 'methodA', content: function() {} } OR
// [
//  { path: 'methodA', content: function() {} }
//  { path: 'methodB', content: function() {} }
// ] OR
// {
//   target: window,
//   prefix: 'namespace',
//   items: []
// }

function install( global, path, content ) {

  var pkgs;
  if ( arguments.length === 1 ) {
    pkgs = parsePkg( global, this );
  } else if ( arguments.length === 2 ) {
    pkgs = parsePkg( path, global );
  } else if ( arguments.length > 2) {
    pkgs = [ { dest: global, path: path, content: content } ];
  } else {
    throw new Error( 'install: invalid arguments' );
  }

  function parsePkg( pkgObj, dest, prefix ) {
    if ( !isExtensible( dest ) || !isExtensible( pkgObj ) ) {
      return [];
    }

    prefix || ( prefix = '' );

    if ( Array.isArray( pkgObj ) ) {
      // Array of pkgs
      return pkgObj.map( function( p ) {
        return parsePkg( p, dest, prefix );
      } );
    } else if ( pkgObj && Array.isArray( pkgObj.items ) ) {
      // definition with meta fields (prefix, dest):
      var ns = pkgObj.ns || pkgObj.prefix || pkgObj.basePath;
      var prefixNext = prefix;
      var destNext = pkgObj.dest || dest;
      if ( ns ) {
        prefixNext = ns + exports.PATH_SEP + prefix;
      }
      return pkgObj.items.map( function( p ) {
        return parsePkg( p, destNext, prefixNext );
      } );
    } else if ( pkgObj && typeof pkgObj.path === 'string'
                && typeof pkgObj.content !== 'undefined' ) {
      // { path: '', content: ... }
      pkgObj.path = prefix + pkgObj.path;
      pkgObj.dest || ( pkgObj.dest = dest );
      return pkgObj;
    } else {
      // plain object:
      return Object
        .keys( pkgObj )
        .map( function( k ) {
          return parsePkg( { path: k, content: path[ k ] }, dest, prefix );
        } );
    }
  }

  function init() {
    var order = 0;
    pkgs = pkgs
      .filter( function( pkg ) {
        return typeof pkg.path === 'string' &&
          typeof pkg.content !== 'undefined';
      } )
      .map( function( pkg ) {
        var tmp = getOrCreateTargetAndKey( pkg.dest, pkg.path );
        pkg.target = tmp.target;
        pkg.key = tmp.key;

        if ( pkg.override !== true &&
             typeof pkg.target[ pkg.key ] !== 'undefined' ) {
          throw new Error( 'install: path ' + pkg.path + ' already exists!' );
        }

        pkg.init || ( pkg.init = function() {} );
        pkg.destroy || ( pkg.destroy = function() {} );

        pkg.target[ pkg.key ] = pkg.content;
        pkg.init();

        return pkg;
      } );
  }

  function reload() {
    unload();
    init();
  }

  function unload() {
    pkgs.forEach( function( p ) {
      p.destroy();
      delete p.target[ p.key ];
    } );
  }

  init();

  var controller = new InstallController( init, reload, unload );

  return controller;

}

function InstallController( init, reload, unload ) {
  return {
    init: init,
    reload: reload,
    unload: unload
  };
}

module.exports = exports = install;
exports.PATH_SEP = '.';

function getOrCreateTargetAndKey( obj, path ) {
  var sep = exports.PATH_SEP;
  var arr = path.split( sep );
  var target = obj, key = arr.shift();
  while ( arr.length > 0 ) {
    if ( typeof target[ key ] === 'undefined' ) {
      target[ key ] = {};
    }
    target = target[ key ];
    key = arr.shift();
  }
  return { target: target, key: key };
};

function isExtensible( x ) {
  return typeof x === 'function' || typeof x === 'object';
}
