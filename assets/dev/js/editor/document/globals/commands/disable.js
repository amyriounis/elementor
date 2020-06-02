import DisableEnable from './base/disable-enable';

// Run when a custom control value is set while the active value is a global
export class Disable extends DisableEnable {
	async apply( args ) {
		const { settings, containers = [ args.container ] } = args;

		containers.forEach( ( container ) => {
			container = container.lookup();

			Object.keys( settings ).forEach( ( setting ) => {
				const localSettings = {},
					promises = Object.entries( container.globals.attributes ).map( async ( [ globalKey, globalValue ] ) => {
						// Means, the control default value were disabled.
						if ( ! globalValue ) {
							return;
						}

						const promise = $e.data.get( globalValue ),
							result = await promise;

						if ( result ) {
							const { value } = result.data;

							if ( container.controls[ globalKey ].groupPrefix ) {
								Object.entries( value ).forEach( ( [ dataKey, dataValue ] ) => {
									const groupPrefix = container.controls[ globalKey ].groupPrefix,
										controlName = globalKey.replace( groupPrefix, '' ) + '_' + dataKey;

									localSettings[ controlName ] = dataValue;
								} );
							} else {
								localSettings[ globalKey ] = value;
							}
						}

						return promise;
					} );

				Promise.all( promises ).then( () => {
					// TODO: Add dev-tools CSS to see if widget have globals.
					if ( Object.keys( localSettings ).length ) {
						$e.run( 'document/elements/settings', {
							container,
							settings: localSettings,
						} );
					}

					container.globals.set( setting, '' );

					container.settings.set( '__globals__', container.globals.toJSON() );

					container.render();
				} );
			} );
		} );
	}
}

export default Disable;
