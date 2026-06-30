import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { trace, context } from '@opentelemetry/api';
import { tap } from 'rxjs/operators';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request = ctx.switchToHttp().getRequest();
    const span = trace.getTracer('teachlink-backend').startSpan(`${request.method} ${request.route?.path || request.url}`);
    
    span.setAttribute('http.method', request.method);
    span.setAttribute('http.url', request.url);
    if (request.user?.id) {
      span.setAttribute('user.id', request.user.id);
    }

    const spanContext = trace.setSpan(context.active(), span);

    return context.with(spanContext, () => {
      return next.handle().pipe(
        tap({
          next: () => span.setStatus({ code: 1 }), // OK
          error: (err) => {
            span.recordException(err);
            span.setStatus({ code: 2, message: err.message }); // ERROR
            span.end();
          },
          complete: () => span.end(),
        }),
      );
    });
  }
}
