/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'iranianPhone', async: false })
export class IranianPhone implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (text.length != 11) return false;
    if (!text.startsWith('09')) return false;
    return true
  }

  defaultMessage(args: ValidationArguments) {
    return 'Phonenumber is not valid!';
  }
}

