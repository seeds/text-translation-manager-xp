'use strict'

const constants = {
	get number () {
		return {
			get MAX_INTEGER () { return 9007199254740991 },
			get MIN_INTEGER () { return -9007199254740991 },
			get MAX_SAFE_INTEGER () { return 2147483647 },
			get MIN_SAFE_INTEGER () { return -2147483648 }
		}
	},
	get default () {
		const self = this
		return {
			get contentWithCharset () { return 'application/json; charset=utf-8' },
			get contentType () { return 'application/json' },
			get headers () { return { 'Cache-Control': 'no-cache' } },
			get pagingSize () { return 7 },
			get sortBy () { return 'modifiedTime DESC' },
			get queryPathTemplate () { return '_path LIKE "/content/{{path}}"' },
			get xdataName () { return app.name.split('.').join('-') }
		}
	},
	get countiesHashMap () {
		return {
			1: 'Østfold',
			2: 'Akershus',
			3: 'Oslo',
			4: 'Hedmark',
			5: 'Oppland',
			6: 'Buskerud',
			7: 'Vestfold',
			8: 'Telemark',
			9: 'Aust-Agder',
			10: 'Vest-Agder',
			11: 'Rogaland',
			12: 'Hordaland',
			14: 'Sogn og Fjordane',
			15: 'Møre og Romsdal',
			16: 'Sør-Trøndelag',
			17: 'Nord-Trøndelag',
			18: 'Nordland',
			19: 'Troms',
			20: 'Finnmark',
			21: 'Svalbard',
			22: 'Jan Mayen',
			23: 'Agder',
			24: 'Innlandet',
			25: 'Møre og Romsdal',
			26: 'Nordland',
			27: 'Oslo',
			28: 'Rogaland',
			29: 'Vestfold og Telemark',
			30: 'Troms og Finnmark',
			31: 'Trøndelag',
			32: 'Vestland',
			33: 'Viken'
		}
	}
}

module.exports = constants
