/*
 * Copyright (c) 2021-2021.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    ClientError, ConflictError,
    InsufficientStorageError,
    InternalServerError,
    ServerError, ServerErrorSettings,
} from '@typescript-error/http';
import { hasOwnProperty } from '@typescript-auth/domains';
import { ExpressNextFunction, ExpressRequest, ExpressResponse } from '../type';
import { useLogger } from '../../../modules/log';

export function errorMiddleware(
    error: Error,
    request: ExpressRequest,
    response: ExpressResponse,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
    next: ExpressNextFunction,
) {
    const code : string | undefined = hasOwnProperty(error, 'code') && typeof error.code === 'string' ?
        error.code :
        undefined;

    // catch and decorate some mysql errors :)
    // eslint-disable-next-line default-case
    switch (code) {
        case 'ER_DUP_ENTRY':
            error = new ConflictError('An entry with some unique attributes already exist.', { previous: error });
            break;
        case 'ER_DISK_FULL':
            error = new InsufficientStorageError('No database operation possible, due the leak of free disk space.', { previous: error });
            break;
    }

    const baseError : ServerError | ClientError = error instanceof ClientError || error instanceof ServerError ?
        error :
        new InternalServerError(error, { decorateMessage: true });

    const statusCode : number = baseError.getOption('statusCode') ?? ServerErrorSettings.InternalServerError.statusCode;

    if (baseError.getOption('logMessage')) {
        const isInspected = error instanceof ClientError || error instanceof ServerError;
        useLogger().log({ level: 'error', message: `${!isInspected ? error.message : (baseError.message || baseError)}` });
    }

    if (baseError.getOption('decorateMessage')) {
        baseError.message = 'An error occurred.';
    }

    return response
        .status(statusCode)
        .json({
            code: baseError.getOption('code') ?? ServerErrorSettings.InternalServerError.code,
            message: baseError.message ?? ServerErrorSettings.InternalServerError.message,
            statusCode,
        })
        .end();
}
