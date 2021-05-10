/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IExpectedAudience } from '../options/IExpected';
import { IValidationOptions } from '../options/IValidationOptions';
import ClaimToken from '../verifiable_credential/ClaimToken';
import { IdTokenValidationResponse, IIdTokenValidation } from './IdTokenValidationResponse';

/**
 * Class for id token validation
 */
export abstract class BaseIdTokenValidation implements IIdTokenValidation {
  /**
   * Create a new instance of @see <IdTokenValidation>
   * @param options Options to steer the validation process
   * @param expectedAudience IExpectedAudience instance
   */
  constructor(protected options: IValidationOptions, private expectedAudience: IExpectedAudience) {
  }

  /**
   * Validate the id token
   * @param idToken The presentation to validate as a signed token
   * @param siopDid needs to be equal to audience of VC
   */
  public async validate(idToken: ClaimToken): Promise<IdTokenValidationResponse> {
    let validationResponse: IdTokenValidationResponse = {
      result: true,
      detailedError: '',
      status: 200
    };

    // Deserialize id token token
    validationResponse = await this.options.getTokenObjectDelegate(validationResponse, idToken.rawToken);
    if (!validationResponse.result) {
      return validationResponse;
    }

    validationResponse = await this.downloadConfigurationAndValidate(validationResponse, idToken);

    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check token time validity
    validationResponse = await this.options.checkTimeValidityOnTokenDelegate(validationResponse);

    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check token scope (aud and iss)
    validationResponse = await this.options.checkScopeValidityOnIdTokenDelegate(validationResponse, this.expectedAudience);

    if (!validationResponse.result) {
      return validationResponse;
    }

    return validationResponse;
  }

  protected abstract downloadConfigurationAndValidate(validationResponse: IdTokenValidationResponse, idToken: ClaimToken): Promise<IdTokenValidationResponse>;
}
