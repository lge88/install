
var install = require( 'install' );
var expect = require( 'expect.js' );

describe( 'install', function() {

  it( 'path', function() {
    var lib = {};
    install( lib, 'a.b.c', function() { return 'a.b.c'; } );
    install( lib, 'a.b.c.d', {
      e: function() { return 'a.b.c.d.e'; }
    } );

    var f1 = function() {
      install( lib, 'a.b.c.d.e', function() {} );
    };

    expect( lib.a.b.c() ).to.be( 'a.b.c' );
    expect( lib.a.b.c.d.e() ).to.be( 'a.b.c.d.e' );
    expect( f1 ).to.throwException( function( e ) {
      expect( e.message ).to.be( 'install: path a.b.c.d.e already exists!' );
    } );

  } );

  it( 'unload/reload', function() {
    var lib = {};
    var bA  = install( lib, 'methodA', function() { return 'a'; } );
    var bB  = install( lib, 'objectB', {
      methodC: function() { return 'b/c'; },
      propertyD: 'b/d'
    } );

    expect( lib.methodA() ).to.be( 'a' );
    expect( lib.objectB.methodC() ).to.be( 'b/c' );
    expect( lib.objectB.propertyD ).to.be( 'b/d' );

    bA.unload();
    expect( lib.methodA ).to.be( undefined );

    bA.reload();
    expect( lib.methodA() ).to.be( 'a' );

    expect( lib.objectB.methodC() ).to.be( 'b/c' );
    bB.unload();
    expect( lib.objectB ).to.be( undefined );

    bB.reload();
    expect( lib.objectB.propertyD ).to.be( 'b/d' );

  } );

  it( 'array input', function() {
    var lib = {};

    var bA  = install( lib, [
      { path: 'a', content: function() { return 'a'; } },
      { path: 'b', content: function() { return 'b'; } },
      { path: 'a.b.c', content: function() { return 'a.b.c'; } }
    ] );

    expect( lib.a() ).to.be( 'a' );
    expect( lib.b() ).to.be( 'b' );
    expect( lib.a.b.c() ).to.be( 'a.b.c' );
  } );

  it( 'object input', function() {
    var lib = {};

    var bA  = install( lib, {
      a: function() { return 'a'; },
      b: function() { return 'b'; },
      c: 'c',
      d: 1000
    } );

    expect( lib.a() ).to.be( 'a' );
    expect( lib.b() ).to.be( 'b' );
    expect( lib.c ).to.be( 'c' );
    expect( lib.d ).to.be( 1000 );
  } );

  it( 'dest', function() {
    var lib = {};

    var bA  = install( {
      dest: lib,
      items: [
        { path: 'a', content: function() { return 'a'; } },
        { path: 'b', content: function() { return 'b'; } },
        { path: 'c', content: 'c' },
        { path: 'd', content: 1000 }
      ]
    } );

    expect( lib.a() ).to.be( 'a' );
    expect( lib.b() ).to.be( 'b' );
    expect( lib.c ).to.be( 'c' );
    expect( lib.d ).to.be( 1000 );
  } );

  it( 'namespace&prefix', function() {
    function Point( x, y ) {
      this.x = x;
      this.y = y;
      return this;
    };

    var bA  = install( Point, {
      ns: 'prototype',
      items: [
        { path: 'sumXY', content: function() { return this.x + this.y; } },
        { path: 'diffXY', content: function() { return this.x - this.y; } },
        { path: 'a.b.c', content: function() { return 'this a.b.c'; } }
      ]
    } );

    var bB = install( Point, {
      prefix: 'ns',
      items: [
        { path: 'a.b.c', content: function() { return 'a.b.c'; } }
      ]
    } );

    var point = new Point( 10, 20 );
    expect( point ).to.eql( { x: 10, y: 20 } );
    expect( point.sumXY() ).to.be( 30 );
    expect( point.diffXY() ).to.be( -10 );
    expect( point.a.b.c() ).to.be( 'this a.b.c' );
    expect( Point.ns.a.b.c() ).to.be( 'a.b.c' );

    bA.unload();
    var point2 = new Point( 10, 20 );
    expect( point.sumXY ).to.be( undefined );

  } );


} );
