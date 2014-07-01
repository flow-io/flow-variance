/**
*
*	STREAM: variance
*
*
*	DESCRIPTION:
*		- Reduce transform stream which calculates the sample variance of streamed data.
*
*
*	NOTES:
*		[1] 
*
*
*	TODO:
*		[1] 
*
*
*	HISTORY:
*		- 2014/05/22: Created. [AReines].
*
*
*	DEPENDENCIES:
*		[1] stream-combiner
*		[2] flow-reduce
*		[3] flow-map
*
*
*	LICENSE:
*		MIT
*
*	Copyright (c) 2014. Athan Reines.
*
*
*	AUTHOR:
*		Athan Reines. athan@nodeprime.com. 2014.
*
*/

(function() {
	'use strict';

	// MODULES //

	var // Stream-combiner:
		pipeline = require( 'stream-combiner' ),

		// Map transform stream:
		mapper = require( 'flow-map' ),

		// Stream reduce:
		reducer = require( 'flow-reduce' );


	// FUNCTIONS //

	/**
	* FUNCTION: reduce()
	*	Returns a data reduction function.
	*
	* @private
	* @returns {function} data reduction function
	*/
	function reduce() {
		var delta = 0;
		/**
		* FUNCTION: reduce( acc, data )
		*	Defines the data reduction.
		*
		* @private
		* @param {object} acc - accumulation object containing three properties: N, mean, sos. 'N' is the observation number accumulator; 'mean' is the mean accumulator; 'sos' is the sum of squared differences accumulator
		* @param {number} data - numeric stream data
		* @returns {object} accumulation object
		*/
		return function reduce( acc, x ) {
			// SOS = Sum of Squared Differences
			acc.N += 1;
			delta = x - acc.mean;
			acc.mean += delta / acc.N;
			acc.sos += delta * ( x-acc.mean );
			return acc;
		};
	} // end FUNCTION reduce()

	/**
	* FUNCTION: transform( data )
	*	Defines the data transformation.
	*
	* @private
	* @param {object} data - stream data
	* @returns {value} transformed data
	*/
	function transform( data ) {
		return data.sos / (data.N-1);
	} // end FUNCTION transform()


	// STREAM //

	/**
	* FUNCTION: Stream()
	*	Stream constructor.
	*
	* @returns {object} Stream instance
	*/
	function Stream() {
		// Default accumulator values:
		this._value = 0; // sum of squared differences!
		this._mean = 0;
		this._N = 0;

		return this;
	} // end FUNCTION stream()

	/**
	* METHOD: value( value )
	*	Setter and getter for initial value from which to begin accumulation. If a value is provided, sets the initial accumulation value. If no value is provided, returns the accumulation value.
	*
	* @param {number} value - initial value
	* @returns {object|number} instance object or initial value
	*/
	Stream.prototype.value = function( value ) {
		if ( !arguments.length ) {
			return this._value;
		}
		if ( typeof value !== 'number' || value !== value ) {
			throw new Error( 'value()::invalid input argument. Variance must be numeric.' );
		}
		this._value = value;
		return this;
	}; // end METHOD value()

	/**
	* METHOD: mean( value )
	*	Setter and getter for initial mean value used during accumulation. If a value is provided, sets the initial mean value. If no value is provided, returns the mean value.
	*
	* @param {number} value - initial mean value
	* @returns {object|number} instance object or initial value
	*/
	Stream.prototype.mean = function( value ) {
		if ( !arguments.length ) {
			return this._mean;
		}
		if ( typeof value !== 'number' || value !== value ) {
			throw new Error( 'mean()::invalid input argument. Initial mean value must be numeric.' );
		}
		this._mean = value;
		return this;
	}; // end METHOD mean()

	/**
	* METHOD: numValues( value )
	*	Setter and getter for the total number of values the initial value for accumulation represents. If a value is provided, sets the number of values. If no value is provided, returns the number of values.
	*
	* @param {number} value - initial value number
	* @returns {object|number} instance object or initial value number
	*/
	Stream.prototype.numValues = function( value ) {
		if ( !arguments.length ) {
			return this._N;
		}
		if ( typeof value !== 'number' || value !== value ) {
			throw new Error( 'numValues()::invalid input argument. Initial value number must be numeric.' );
		}
		this._N = value;
		return this;
	}; // end METHOD numValues()

	/**
	* METHOD: stream()
	*	Returns a JSON data reduction stream for calculating the statistic.
	*/
	Stream.prototype.stream = function() {
		var rStream, mStream, pStream;

		// Get the reduction stream:
		rStream = reducer()
			.reduce( reduce() )
			.acc({
				'N': this._N,
				'mean': this._mean,
				'sos': this._value
			})
			.stream();

		// Get the map stream:
		mStream = mapper()
			.map( transform )
			.stream();

		// Create a stream pipeline:
		pStream = pipeline(
			rStream,
			mStream
		);

		// Return the pipeline:
		return pStream;
	}; // end METHOD stream()


	// EXPORTS //

	module.exports = function createStream() {
		return new Stream();
	};

})();