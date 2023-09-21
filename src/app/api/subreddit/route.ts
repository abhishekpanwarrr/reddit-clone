import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubredditValidator } from "@/lib/validators/subReddit";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const session = await getAuthSession()

        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 })
        }
        const body = await req.json()
        const { name } = SubredditValidator.parse(body)
        const subRedditExists = await db.subreddit.findFirst({
            where: {
                name
            }
        })
        if (subRedditExists) {
            return new Response('Subreddit already exists', { status: 409 })
        }
        const subReddit = await db.subreddit.create({
            data: {
                name,
                creatorId: session.user.id
            }
        })

        await db.subscription.create({
            data: {
                userId: session.user.id,
                subredditId: subReddit.id
            }
        })
        return new Response(subReddit.name, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 422 })
        }
        return new Response("Could not create reddit ", { status: 500 })
    }
}